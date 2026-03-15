import type { HttpContext } from '@adonisjs/core/http'
import TeamMember from '#models/team/team_member'
import Team from '#models/team/team'

export default class InviteInfo {
  async handle({ params, response }: HttpContext) {
    const invitation = await TeamMember.query()
      .where('invitationToken', params.token)
      .where('status', 'pending')
      .first()

    if (!invitation) {
      return response.notFound({ message: 'Invalid or expired invitation' })
    }

    const team = await Team.findOrFail(invitation.teamId)

    return response.ok({
      invitation: {
        email: invitation.invitedEmail,
        role: invitation.role,
        team: {
          name: team.name,
          iconUrl: team.iconUrl,
        },
      },
    })
  }
}
