import type { HttpContext } from '@adonisjs/core/http'
import ApiKey from '#models/api/api_key'
import ApiRequestLog from '#models/api/api_request_log'
import adminTransformer from '#transformers/api/api_key_admin_transformer'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'

export default class LogsList {
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

    const limit = Math.min(500, Math.max(1, Number.parseInt(request.input('limit', '100'), 10)))
    const statusBucket = request.input('status_bucket')

    const query = ApiRequestLog.query()
      .where('api_key_id', key.id)
      .orderBy('created_at', 'desc')
      .limit(limit)
    if (statusBucket === '2xx') query.whereBetween('status', [200, 299])
    if (statusBucket === '4xx') query.whereBetween('status', [400, 499])
    if (statusBucket === '5xx') query.whereBetween('status', [500, 599])

    const rows = await query
    return response.ok({
      data: rows.map((r) => adminTransformer.transformRequestLog(r)),
    })
  }
}
