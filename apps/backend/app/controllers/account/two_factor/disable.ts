import type { HttpContext } from '@adonisjs/core/http'
import TwoFactorService from '#services/auth/two_factor_service'
import AuditLog from '#models/shared/audit_log'

export default class Disable {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const { code } = request.only(['code'])

    if (!user.twoFactorEnabled || !user.twoFactorSecretEncrypted) {
      return response.badRequest({ message: 'Two-factor authentication is not enabled' })
    }

    const secret = TwoFactorService.decryptSecret(user.twoFactorSecretEncrypted)
    const isValid = TwoFactorService.verifyToken(secret, code)

    if (!isValid.valid) {
      return response.badRequest({ message: 'Invalid verification code' })
    }

    user.twoFactorEnabled = false
    user.twoFactorSecretEncrypted = null
    user.recoveryCodesEncrypted = null
    await user.save()

    await AuditLog.create({
      userId: user.id,
      action: 'user.2fa_disabled',
      resourceType: 'user',
      resourceId: user.id,
      severity: 'critical',
    })

    return response.ok({ message: 'Two-factor authentication disabled successfully' })
  }
}
