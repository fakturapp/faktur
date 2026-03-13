import type { HttpContext } from '@adonisjs/core/http'
import TeamMember from '#models/team/team_member'

export default class RevokeInvite {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const currentMember = await TeamMember.query()
      .where('teamId', user.currentTeamId)
      .where('userId', user.id)
      .first()

    if (!currentMember || !['super_admin', 'admin'].includes(currentMember.role)) {
      return response.forbidden({ message: 'Only admins can revoke invitations' })
    }

    const invitation = await TeamMember.query()
      .where('id', params.id)
      .where('teamId', user.currentTeamId)
      .where('status', 'pending')
      .first()

    if (!invitation) {
      return response.notFound({ message: 'Invitation not found' })
    }

    await invitation.delete()

    return response.ok({ message: 'Invitation revoked' })
  }
}
