import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import ApiKey from '#models/api/api_key'
import ApiKeyWebhook from '#models/api/api_key_webhook'
import webhookSigner from '#services/api/webhook_signer'
import encryptionService from '#services/encryption/encryption_service'
import auditLog from '#services/api/audit_log_service'
import adminTransformer from '#transformers/api/api_key_admin_transformer'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'
import { setWebhookValidator } from '#validators/api/api_key_dashboard_validators'
import { isKnownEvent } from '#services/api/webhook_events'

export default class WebhookSet {
  async handle(ctx: HttpContext) {
    const { auth, params, request, response } = ctx
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
    if (!key) return response.notFound({ message: 'API key not found' })

    const payload = await setWebhookValidator.validate(request.body())

    const unknownEvents = payload.events.filter((e) => !isKnownEvent(e))
    if (unknownEvents.length > 0) {
      return response.unprocessableEntity({
        code: 'invalid_events',
        message: `Unknown events: ${unknownEvents.join(', ')}`,
      })
    }

    let plaintext: string | null = null
    let webhook: ApiKeyWebhook | null = (key.webhook as unknown as ApiKeyWebhook | null) ?? null
    if (!webhook) {
      const gen = webhookSigner.generateSecret()
      plaintext = gen.plaintext
      webhook = await ApiKeyWebhook.create({
        apiKeyId: key.id,
        url: payload.url,
        secretHash: encryptionService.encrypt(gen.plaintext),
        secretLast4: gen.last4,
        events: payload.events,
        isActive: true,
        consecutiveFailures: 0,
      })
    } else {
      webhook.url = payload.url
      webhook.events = payload.events
      webhook.isActive = true
      webhook.consecutiveFailures = 0
      await webhook.save()
    }

    await auditLog.emit({
      ctx,
      teamId,
      projectId: key.projectId,
      action: plaintext ? 'webhook.configured' : 'webhook.updated',
      targetType: 'webhook',
      targetId: webhook.id,
      targetLabel: key.name,
      metadata: {
        url: webhook.url,
        events: webhook.events,
        api_key_id: key.id,
      },
    })

    return response.ok({
      data: adminTransformer.transformWebhook(webhook),
      plaintext_secret: plaintext,
      message: plaintext
        ? 'Webhook configured. Copy the signing secret now — it will not be shown again.'
        : 'Webhook updated.',
      now: DateTime.utc().toISO(),
    })
  }
}
