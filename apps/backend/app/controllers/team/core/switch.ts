import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import TeamMember from '#models/team/team_member'

const switchValidator = vine.compile(
  vine.object({
    teamId: vine.string().trim(),
  })
)

export default class Switch {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(switchValidator)

    const membership = await TeamMember.query()
      .where('teamId', payload.teamId)
      .where('userId', user.id)
      .where('status', 'active')
      .first()

    if (!membership) {
      return response.forbidden({ message: 'You are not a member of this team' })
    }

    user.currentTeamId = payload.teamId
    await user.save()

    return response.ok({ message: 'Team switched', currentTeamId: payload.teamId })
  }
}
