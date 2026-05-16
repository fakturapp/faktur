import type { HttpContext } from '@adonisjs/core/http'
import ApiKey from '#models/api/api_key'
import ApiWebhookDelivery from '#models/api/api_webhook_delivery'
import adminTransformer from '#transformers/api/api_key_admin_transformer'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'

export default class DeliveriesList {
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

    const key = await ApiKey.query().where('id', internalId).where('team_id', teamId).first()
    if (!key) return response.notFound({ message: 'API key not found' })

    const status = request.input('status')
    const eventType = request.input('event_type')
    const limit = Math.min(200, Math.max(1, Number.parseInt(request.input('limit', '50'), 10)))

    const query = ApiWebhookDelivery.query()
      .where('api_key_id', key.id)
      .orderBy('created_at', 'desc')
      .limit(limit)
    if (status) query.where('status', String(status))
    if (eventType) query.where('event_type', String(eventType))

    const rows = await query
    return response.ok({
      data: rows.map((r) => adminTransformer.transformDelivery(r)),
    })
  }
}
