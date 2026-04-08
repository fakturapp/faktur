import type { HttpContext } from '@adonisjs/core/http'
import TeamMember from '#models/team/team_member'
import keyStore from '#services/crypto/key_store'

export default class Leave {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const membership = await TeamMember.query()
      .where('teamId', teamId)
      .where('userId', user.id)
      .where('status', 'active')
      .first()

    if (!membership) {
      return response.notFound({ message: "Vous n'êtes pas membre de cette équipe" })
    }

    if (membership.role === 'super_admin') {
      return response.forbidden({
        message: "Le propriétaire ne peut pas quitter l'équipe. Transférez la propriété ou supprimez l'équipe.",
      })
    }

    await membership.delete()

    keyStore.clear(user.id)

    const otherMembership = await TeamMember.query()
      .where('userId', user.id)
      .where('status', 'active')
      .first()

    if (otherMembership) {
      user.currentTeamId = otherMembership.teamId
    } else {
      user.currentTeamId = null
      user.onboardingCompleted = false
    }
    await user.save()

    return response.ok({
      message: "Vous avez quitté l'équipe",
      switchedToTeamId: user.currentTeamId,
    })
  }
}
