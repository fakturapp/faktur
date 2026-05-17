import type { HttpContext } from '@adonisjs/core/http'
import ApiKey from '#models/api/api_key'
import apiKeyService from '#services/api/api_key_service'
import adminTransformer from '#transformers/api/api_key_admin_transformer'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'

export default class Rotate {
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

    const key = await ApiKey.query().where('id', internalId).where('team_id', teamId).first()
    if (!key) return response.notFound({ message: 'API key not found' })

    const rotated = await apiKeyService.rotate(key.id)
    return response.ok({
      data: adminTransformer.transform(rotated.record),
      plaintext: rotated.plaintext,
      grace_until: null,
      message: 'API key rotated. The previous secret is now invalid.',
    })
  }
}
