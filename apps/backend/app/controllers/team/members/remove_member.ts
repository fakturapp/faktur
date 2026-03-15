import type { HttpContext } from '@adonisjs/core/http'
import TeamMember from '#models/team/team_member'

export default class RemoveMember {
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
      return response.forbidden({ message: 'Only admins can remove members' })
    }

    const targetMember = await TeamMember.query()
      .where('id', params.id)
      .where('teamId', user.currentTeamId)
      .first()

    if (!targetMember) {
      return response.notFound({ message: 'Member not found' })
    }

    // Cannot remove super_admin
    if (targetMember.role === 'super_admin') {
      return response.forbidden({ message: 'Cannot remove the Super Admin' })
    }

    // Admin cannot remove another admin (only super_admin can)
    if (targetMember.role === 'admin' && currentMember.role !== 'super_admin') {
      return response.forbidden({ message: 'Only the Super Admin can remove admins' })
    }

    await targetMember.delete()

    return response.ok({ message: 'Member removed' })
  }
}
