import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import hash from '@adonisjs/core/services/hash'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import { deleteTeamCascade } from '#services/team/delete_team_service'

const deleteTeamValidator = vine.compile(
  vine.object({
    teamName: vine.string(),
    password: vine.string(),
  })
)

export default class Delete {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const payload = await request.validateUsing(deleteTeamValidator)

    const membership = await TeamMember.query()
      .where('teamId', teamId)
      .where('userId', user.id)
      .where('status', 'active')
      .first()

    if (!membership || membership.role !== 'super_admin') {
      return response.forbidden({ message: "Seul le propriétaire peut supprimer l'équipe" })
    }

    const team = await Team.find(teamId)
    if (!team) {
      return response.notFound({ message: 'Team not found' })
    }

    if (team.name !== payload.teamName) {
      return response.unprocessableEntity({ message: "Le nom de l'équipe ne correspond pas" })
    }

    const isValid = await hash.verify(user.password, payload.password)
    if (!isValid) {
      return response.unauthorized({ message: 'Mot de passe incorrect' })
    }

    await deleteTeamCascade(teamId)

    const otherMembership = await TeamMember.query()
      .where('userId', user.id)
      .where('status', 'active')
      .preload('team')
      .first()

    if (otherMembership) {
      user.currentTeamId = otherMembership.teamId
    } else {
      user.currentTeamId = null
      user.onboardingCompleted = false
    }
    await user.save()

    return response.ok({
      message: 'Équipe supprimée',
      switchedToTeamId: user.currentTeamId,
    })
  }
}
