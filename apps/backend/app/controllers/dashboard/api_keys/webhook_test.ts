import type { HttpContext } from '@adonisjs/core/http'
import ApiKey from '#models/api/api_key'
import webhookEmitter from '#services/api/webhook_event_emitter'
import webhookDispatcher from '#services/api/webhook_dispatcher'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'
import { testWebhookValidator } from '#validators/api/api_key_dashboard_validators'
import { isKnownEvent, type WebhookEventType } from '#services/api/webhook_events'

export default class WebhookTest {
  async handle({ auth, params, request, response }: HttpContext) {
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
      return response.unprocessableEntity({
        message: 'Configure a webhook URL before sending a test delivery.',
      })
    }

    const payload = await testWebhookValidator.validate(request.body())
    const eventType: WebhookEventType =
      payload.event_type && isKnownEvent(payload.event_type)
        ? (payload.event_type as WebhookEventType)
        : 'invoice.paid'

    const delivery = await webhookEmitter.createTestDelivery({
      apiKey: key,
      webhook: key.webhook,
      eventType,
    })
    const outcome = await webhookDispatcher.dispatch(delivery)

    return response.ok({
      delivered: outcome.delivered,
      status_code: outcome.statusCode,
      error: outcome.error,
      latency_ms: outcome.latencyMs,
      event_type: eventType,
      delivery_id: publicIdCodec.encode('webhook_delivery', delivery.id),
    })
  }
}
