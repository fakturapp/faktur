import type { HttpContext } from '@adonisjs/core/http'
import ApiKey from '#models/api/api_key'
import webhookSigner from '#services/api/webhook_signer'
import encryptionService from '#services/encryption/encryption_service'
import auditLog from '#services/api/audit_log_service'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'

export default class WebhookRotateSecret {
  async handle(ctx: HttpContext) {
    const { auth, params, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    if (!teamId) return response.badRequest({ message: 'No team selected' })

    let internalId: string
    try {
      internalId = publicIdCodec.decode('api_key', params.id)
    } catch (err) {
      if (err instanceof PublicIdParseError) {
        return response.notFound({ message: 'API key not found' })
      }
      throw err
    }

    const key = await ApiKey.query()
      .where('id', internalId)
      .where('team_id', teamId)
      .preload('webhook')
      .first()
    if (!key || !key.webhook) {
      return response.notFound({ message: 'Webhook not configured' })
    }

    const gen = webhookSigner.generateSecret()
    key.webhook.secretHash = encryptionService.encrypt(gen.plaintext)
    key.webhook.secretLast4 = gen.last4
    await key.webhook.save()

    await auditLog.emit({
      ctx,
      teamId,
      projectId: key.projectId,
      action: 'webhook.secret_rotated',
      targetType: 'webhook',
      targetId: key.webhook.id,
      targetLabel: key.name,
      metadata: { api_key_id: key.id, new_last4: gen.last4 },
    })

    return response.ok({
      plaintext_secret: gen.plaintext,
      masked_secret: `whsec_…${gen.last4}`,
      message:
        'New signing secret generated. Copy it now — for security it will not be shown again.',
    })
  }
}
