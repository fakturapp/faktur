import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import ApiProject from '#models/api/api_project'
import transformer from '#transformers/api/api_project_transformer'

export default class List {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId
    if (!teamId) return response.badRequest({ message: 'No team selected' })

    const projects = await ApiProject.query()
      .where('team_id', teamId)
      .orderBy('is_default', 'desc')
      .orderBy('created_at', 'asc')

    const rows = await db
      .from('api_keys')
      .where('team_id', teamId)
      .whereNull('revoked_at')
      .groupBy('project_id')
      .select('project_id')
      .count('id as count')

    const counts: Record<string, number> = {}
    for (const r of rows) counts[r.project_id] = Number(r.count)

    return response.ok({ data: transformer.transformMany(projects, counts) })
  }
}
