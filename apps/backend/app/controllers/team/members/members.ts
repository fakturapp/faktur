import type { HttpContext } from '@adonisjs/core/http'
import TeamMember from '#models/team/team_member'

export default class Members {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const members = await TeamMember.query().where('teamId', user.currentTeamId).preload('user')

    return response.ok({
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        status: m.status,
        invitedEmail: m.invitedEmail,
        joinedAt: m.joinedAt,
        invitedAt: m.invitedAt,
        user: m.userId
          ? {
              id: m.user?.id,
              fullName: m.user?.fullName,
              email: m.user?.email,
              avatarUrl: m.user?.avatarUrl,
            }
          : null,
      })),
    })
  }
}
