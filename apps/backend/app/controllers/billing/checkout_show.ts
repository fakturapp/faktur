import type { HttpContext } from '@adonisjs/core/http'
import TeamMember from '#models/team/team_member'
import billingService from '#services/billing/billing_service'

export default class CheckoutShow {
  async handle({ auth, params, response }: HttpContext) {
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

    let session
    try {
      session = await billingService.retrieveCheckoutSession(params.id)
    } catch {
      return response.notFound({ message: 'Session de paiement introuvable' })
    }

    if (session.metadata?.team_id !== user.currentTeamId) {
      return response.forbidden({ message: 'Cette session ne correspond pas à votre équipe.' })
    }

    return response.ok({
      clientSecret: session.client_secret,
      publishableKey: billingService.publishableKey(),
      plan: session.metadata?.plan ?? null,
      period: session.metadata?.period ?? null,
      status: session.status,
      amountSubtotal: session.amount_subtotal,
      amountTotal: session.amount_total,
      amountDiscount: session.total_details?.amount_discount ?? 0,
    })
  }
}
