import type { HttpContext } from '@adonisjs/core/http'
import ApiKey from '#models/api/api_key'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'

export default class WebhookDestroy {
  async handle({ auth, params, response }: HttpContext) {
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
    if (!key.webhook) return response.ok({ message: 'No webhook configured' })

    await key.webhook.delete()
    return response.ok({ message: 'Webhook removed' })
  }
}
