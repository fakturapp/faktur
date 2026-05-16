import type { HttpContext } from '@adonisjs/core/http'
import ApiKey from '#models/api/api_key'
import adminTransformer from '#transformers/api/api_key_admin_transformer'

export default class List {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId
    if (!teamId) return response.badRequest({ message: 'No team selected' })

    const keys = await ApiKey.query()
      .where('team_id', teamId)
      .orderBy('created_at', 'desc')

    return response.ok({ data: adminTransformer.transformMany(keys) })
  }
}
