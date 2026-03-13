import type { HttpContext } from '@adonisjs/core/http'
import Team from '#models/team/team'

export default class Show {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const team = await Team.query()
      .where('id', user.currentTeamId)
      .preload('members', (q) => {
        q.preload('user')
      })
      .preload('company')
      .firstOrFail()

    return response.ok({
      team: {
        id: team.id,
        name: team.name,
        iconUrl: team.iconUrl,
        ownerId: team.ownerId,
        members: team.members.map((m) => {
          const hasUser = !!m.userId

          return {
            id: m.id,
            userId: m.userId,
            role: m.role,
            status: m.status,
            invitedEmail: m.invitedEmail,
            joinedAt: m.joinedAt,
            invitedAt: m.invitedAt,
            user: hasUser
              ? {
                  id: m.user?.id,
                  fullName: m.user?.fullName,
                  email: m.user?.email,
                  avatarUrl: m.user?.avatarUrl,
                }
              : null,
          }
        }),
        hasCompany: !!team.company,
      },
    })
  }
}
