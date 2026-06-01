import type { HttpContext } from '@adonisjs/core/http'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import billingService from '#services/billing/billing_service'

export default class PaymentMethod {
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
      return response.forbidden({ message: "Seul le propriétaire peut consulter le paiement." })
    }

    const team = await Team.findOrFail(user.currentTeamId)
    if (!team.stripeCustomerId && !team.stripeSubscriptionId) {
      return response.ok({ method: null })
    }

    try {
      const method = await billingService.retrievePaymentMethod({
        subscriptionId: team.stripeSubscriptionId,
        customerId: team.stripeCustomerId,
      })
      return response.ok({ method })
    } catch (err: any) {
      return response.badRequest({ message: err?.message || 'Erreur Stripe' })
    }
  }
}
