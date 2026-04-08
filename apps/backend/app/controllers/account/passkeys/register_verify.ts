import type { HttpContext } from '@adonisjs/core/http'
import passkeyService from '#services/auth/passkey_service'
import keyStore from '#services/crypto/key_store'
import AuditLog from '#models/shared/audit_log'

export default class RegisterVerify {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const { credential: webauthnResponse, friendlyName } = request.only([
      'credential',
      'friendlyName',
    ])

    if (!webauthnResponse) {
      return response.badRequest({ message: 'Missing credential response' })
    }

    const name = (friendlyName || '').trim() || 'Clé d\'accès'

    try {
      const { credential, verified } = await passkeyService.verifyRegistration(
        user.id,
        webauthnResponse,
        name
      )

      if (!verified) {
        return response.badRequest({ message: 'Passkey verification failed' })
      }

      const kek = keyStore.getKEK(user.id)
      if (kek) {
        credential.encryptedKek = passkeyService.encryptKekForPasskey(kek, credential.credentialId)
        await credential.save()
      }

      await AuditLog.create({
        userId: user.id,
        action: 'user.passkey_registered',
        resourceType: 'passkey_credential',
        resourceId: credential.id,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
        severity: 'info',
        metadata: { friendlyName: name },
      })

      return response.ok({
        message: 'Passkey registered successfully',
        passkey: {
          id: credential.id,
          friendlyName: credential.friendlyName,
          backedUp: credential.backedUp,
          createdAt: credential.createdAt,
        },
      })
    } catch (err: any) {
      console.error('[Passkey Register]', err?.message || err)
      return response.badRequest({
        message: err.message || 'Registration verification failed',
      })
    }
  }
}
