import type { HttpContext } from '@adonisjs/core/http'
import ApiKey from '#models/api/api_key'
import adminTransformer from '#transformers/api/api_key_admin_transformer'

export default class RecentlyUsed {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId
    if (!teamId) return response.badRequest({ message: 'No team selected' })

    const limitRaw = Number(request.input('limit', 5))
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 20) : 5

    const keys = await ApiKey.query()
      .where('team_id', teamId)
      .whereNotNull('last_used_at')
      .orderBy('last_used_at', 'desc')
      .limit(limit)

    return response.ok({ data: adminTransformer.transformMany(keys) })
  }
}
