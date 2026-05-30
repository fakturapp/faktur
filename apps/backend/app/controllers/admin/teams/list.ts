import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Team from '#models/team/team'

export default class ListTeams {
  async handle({ request, response }: HttpContext) {
    const q = String(request.input('q') ?? '').trim()

    const query = Team.query().preload('owner').orderBy('created_at', 'desc').limit(500)
    if (q) {
      query.where('name', 'ilike', `%${q}%`)
    }

    const teams = await query
    const teamIds = teams.map((t) => t.id)

    const memberCounts = new Map<string, number>()
    if (teamIds.length > 0) {
      const rows = await db
        .from('team_members')
        .whereIn('team_id', teamIds)
        .where('status', 'active')
        .groupBy('team_id')
        .select('team_id')
        .count('* as count')
      for (const row of rows) memberCounts.set(row.team_id, Number(row.count))
    }

    return response.ok({
      teams: teams.map((t) => ({
        id: t.id,
        name: t.name,
        iconUrl: t.iconUrl,
        plan: t.plan,
        encryptionMode: t.encryptionMode,
        ownerId: t.ownerId,
        ownerEmail: t.owner?.email ?? null,
        ownerName: t.owner?.fullName ?? null,
        memberCount: memberCounts.get(t.id) ?? 0,
        createdAt: t.createdAt.toISO(),
      })),
    })
  }
}
