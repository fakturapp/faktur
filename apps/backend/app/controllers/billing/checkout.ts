import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import env from '#start/env'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import billingService from '#services/billing/billing_service'

const checkoutValidator = vine.compile(
  vine.object({
    plan: vine.enum(['pro', 'team'] as const),
    period: vine.enum(['monthly', 'annual'] as const),
  })
)

export default class Checkout {
  async handle({ auth, request, response }: HttpContext) {
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
      return response.forbidden({
        message: "Seul le propriétaire de l'équipe peut gérer l'abonnement.",
      })
    }

    const team = await Team.findOrFail(user.currentTeamId)
    const payload = await request.validateUsing(checkoutValidator)

    const customerId = await billingService.ensureCustomer(team, user.email)
    const frontendUrl = env.get('FRONTEND_URL') ?? 'http://localhost:3000'

    let couponId: string | undefined
    if (
      team.stripeSubscriptionId &&
      (team.plan === 'pro' || team.plan === 'team') &&
      (team.planPeriod === 'monthly' || team.planPeriod === 'annual')
    ) {
      const samePlan = team.plan === payload.plan && team.planPeriod === payload.period
      if (!samePlan) {
        try {
          const sub = await billingService.retrieveSubscription(team.stripeSubscriptionId)
          const status = String((sub as any)?.status ?? '')
          if (status === 'active' || status === 'trialing' || status === 'past_due') {
            const credit = await billingService.createUnusedTimeCoupon({
              currentPlan: team.plan,
              currentPeriod: team.planPeriod,
              targetPlan: payload.plan,
              targetPeriod: payload.period,
              subscription: sub,
              teamId: team.id,
            })
            couponId = credit?.couponId
          }
        } catch {}
      }
    }

    try {
      const session = await billingService.createCheckoutSession({
        team,
        customerId,
        plan: payload.plan,
        period: payload.period,
        returnUrl: `${frontendUrl}/dashboard/settings/plan?checkout={CHECKOUT_SESSION_ID}`,
        couponId,
      })
      return response.ok({ sessionId: session.id })
    } catch (err: any) {
      return response.badRequest({
        message: err?.message || 'Impossible de créer la session de paiement',
      })
    }
  }
}
