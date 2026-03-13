import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'

const updateTeamValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(100).optional(),
    iconUrl: vine.string().trim().maxLength(500).optional(),
  })
)

export default class Update {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const member = await TeamMember.query()
      .where('teamId', user.currentTeamId)
      .where('userId', user.id)
      .first()

    if (!member || !['super_admin', 'admin'].includes(member.role)) {
      return response.forbidden({ message: 'Only admins can update the team' })
    }

    const team = await Team.findOrFail(user.currentTeamId)
    const payload = await request.validateUsing(updateTeamValidator)

    if (payload.name !== undefined) team.name = payload.name
    if (payload.iconUrl !== undefined) team.iconUrl = payload.iconUrl

    await team.save()

    return response.ok({
      message: 'Team updated successfully',
      team: {
        id: team.id,
        name: team.name,
        iconUrl: team.iconUrl,
      },
    })
  }
}
