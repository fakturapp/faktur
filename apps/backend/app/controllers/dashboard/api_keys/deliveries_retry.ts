import type { HttpContext } from '@adonisjs/core/http'
import ApiKey from '#models/api/api_key'
import ApiWebhookDelivery from '#models/api/api_webhook_delivery'
import webhookDispatcher from '#services/api/webhook_dispatcher'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'
import { DateTime } from 'luxon'

export default class DeliveriesRetry {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId
    if (!teamId) return response.badRequest({ message: 'No team selected' })

    let keyInternalId: string
    let deliveryInternalId: string
    try {
      keyInternalId = publicIdCodec.decode('api_key', params.id)
      deliveryInternalId = publicIdCodec.decode('webhook_delivery', params.deliveryId)
    } catch (err) {
      if (err instanceof PublicIdParseError) {
        return response.notFound({ message: 'Resource not found' })
      }
      throw err
    }

    const key = await ApiKey.query().where('id', keyInternalId).where('team_id', teamId).first()
    if (!key) return response.notFound({ message: 'API key not found' })

    const delivery = await ApiWebhookDelivery.query()
      .where('id', deliveryInternalId)
      .where('api_key_id', key.id)
      .first()
    if (!delivery) return response.notFound({ message: 'Delivery not found' })

    delivery.nextAttemptAt = DateTime.now()
    delivery.status = 'pending'
    await delivery.save()

    const outcome = await webhookDispatcher.dispatch(delivery)
    return response.ok({
      delivered: outcome.delivered,
      status_code: outcome.statusCode,
      error: outcome.error,
      latency_ms: outcome.latencyMs,
    })
  }
}
