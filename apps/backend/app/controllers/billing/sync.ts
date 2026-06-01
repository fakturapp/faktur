import type { HttpContext } from '@adonisjs/core/http'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import billingService from '#services/billing/billing_service'
import { applyStripeSubscription } from '#services/billing/subscription_state'

export default class Sync {
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
      return response.ok({ synced: false })
    }

    let subs: any[]
    try {
      subs = await billingService.listSubscriptions(team.stripeCustomerId)
    } catch (err: any) {
      return response.badRequest({ message: err?.message || 'Erreur Stripe' })
    }

    const actives = subs
      .filter((s) => ['active', 'trialing', 'past_due'].includes(s.status))
      .sort((a, b) => Number(b.created || 0) - Number(a.created || 0))
    const active = actives[0]

    if (!active) {
      if (team.stripeSubscriptionId) {
        team.plan = 'free'
        team.subscriptionStatus = 'canceled'
        team.stripeSubscriptionId = null
        team.subscriptionCancelAtPeriodEnd = false
        team.subscriptionCancelExternal = false
        team.subscriptionGraceEndsAt = null
        team.subscriptionStartedAt = null
        team.planPeriod = null
        team.pendingPlan = null
        team.pendingPlanPeriod = null
        await team.save()
        return response.ok({ synced: true, plan: 'free', status: 'canceled' })
      }
      return response.ok({ synced: false })
    }

    for (const old of actives.slice(1)) {
      try {
        await billingService.cancelImmediately(old.id)
      } catch {}
    }

    let full: any = active
    try {
      full = await billingService.retrieveSubscription(active.id)
    } catch {}

    let schedule: any = null
    if (full.schedule) {
      try {
        schedule = await billingService.retrieveSchedule(String(full.schedule))
      } catch {}
    }

    applyStripeSubscription(team, full, schedule)
    await team.save()
    return response.ok({ synced: true, plan: team.plan, status: team.subscriptionStatus })
  }
}
