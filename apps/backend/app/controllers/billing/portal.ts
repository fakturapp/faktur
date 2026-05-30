import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import billingService from '#services/billing/billing_service'

export default class Portal {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!

    if (!billingService.isConfigured()) {
      return response.serviceUnavailable({ message: "Le paiement n'est pas encore configuré." })
    }
    if (!user.currentTeamId) {
      return response.badRequest({ message: 'Aucune équipe sélectionnée' })
    }

    const member = await TeamMember.query()
      .where('teamId', user.currentTeamId)
      .where('userId', user.id)
      .where('status', 'active')
      .first()
    if (!member || member.role !== 'super_admin') {
      return response.forbidden({ message: "Seul le propriétaire peut gérer l'abonnement." })
    }

    const team = await Team.findOrFail(user.currentTeamId)
    if (!team.stripeCustomerId) {
      return response.badRequest({ message: 'Aucun abonnement à gérer.' })
    }

    const frontendUrl = env.get('FRONTEND_URL') ?? 'http://localhost:3000'
    try {
      const portal = await billingService.createPortalSession(
        team.stripeCustomerId,
        `${frontendUrl}/dashboard/settings/plan`
      )
      return response.ok({ url: portal.url })
    } catch (err: any) {
      return response.badRequest({
        message: err?.message || "Impossible d'ouvrir le portail de gestion",
      })
    }
  }
}
