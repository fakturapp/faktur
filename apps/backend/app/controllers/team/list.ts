import type { HttpContext } from '@adonisjs/core/http'
import TeamMember from '#models/team/team_member'

export default class List {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!

    const memberships = await TeamMember.query()
      .where('userId', user.id)
      .where('status', 'active')
      .preload('team')

    return response.ok({
      teams: memberships.map((m) => ({
        id: m.team.id,
        name: m.team.name,
        iconUrl: m.team.iconUrl,
        role: m.role,
        isOwner: m.team.ownerId === user.id,
        isCurrent: m.team.id === user.currentTeamId,
      })),
    })
  }
}
