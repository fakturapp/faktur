import type { HttpContext } from '@adonisjs/core/http'
import Team from '#models/team/team'

export default class ListTeams {
  async handle({ request, response }: HttpContext) {
    const q = String(request.input('q') ?? '').trim()

    const query = Team.query()
      .preload('owner')
      .preload('members', (m) => m.preload('user'))
      .orderBy('created_at', 'desc')
      .limit(500)
    if (q) {
      query.where('name', 'ilike', `%${q}%`)
    }

    const teams = await query

    return response.ok({
      teams: teams.map((t) => {
        const members = t.members
          .filter((m) => m.status === 'active')
          .map((m) => ({
            id: m.id,
            userId: m.userId,
            role: m.role,
            isOwner: m.userId === t.ownerId,
            fullName: m.user?.fullName ?? null,
            email: m.user?.email ?? null,
            avatarUrl: m.user?.avatarUrl ?? null,
          }))
        return {
          id: t.id,
          name: t.name,
          iconUrl: t.iconUrl,
          plan: t.plan,
          encryptionMode: t.encryptionMode,
          ownerId: t.ownerId,
          ownerEmail: t.owner?.email ?? null,
          ownerName: t.owner?.fullName ?? null,
          memberCount: members.length,
          members,
          createdAt: t.createdAt.toISO(),
        }
      }),
    })
  }
}
