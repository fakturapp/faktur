import type { HttpContext } from '@adonisjs/core/http'
import ApiKey from '#models/api/api_key'
import adminTransformer from '#transformers/api/api_key_admin_transformer'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'

export default class Show {
  async handle({ auth, response, params }: HttpContext) {
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

    return response.ok({
      data: adminTransformer.transform(key),
      webhook: key.webhook ? adminTransformer.transformWebhook(key.webhook) : null,
    })
  }
}
