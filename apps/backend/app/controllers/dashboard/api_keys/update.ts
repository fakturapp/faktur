import type { HttpContext } from '@adonisjs/core/http'
import ApiKey from '#models/api/api_key'
import scopeChecker from '#services/api/scope_checker'
import adminTransformer from '#transformers/api/api_key_admin_transformer'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'
import { updateApiKeyValidator } from '#validators/api/api_key_dashboard_validators'

export default class Update {
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
    if (key.revokedAt)
      return response.unprocessableEntity({ message: 'Cannot update a revoked key' })

    const payload = await updateApiKeyValidator.validate(request.body())

    if (payload.name !== undefined) key.name = payload.name
    if (payload.scopes !== undefined) {
      const invalid = payload.scopes.filter((s) => !scopeChecker.validate(s))
      if (invalid.length > 0) {
        return response.unprocessableEntity({
          code: 'invalid_scopes',
          message: `Unknown scopes: ${invalid.join(', ')}`,
        })
      }
      key.scopes = scopeChecker.normalize(payload.scopes)
    }
    if (payload.allowed_ips !== undefined) {
      key.allowedIps = payload.allowed_ips
    }

    await key.save()
    return response.ok({ data: adminTransformer.transform(key) })
  }
}
