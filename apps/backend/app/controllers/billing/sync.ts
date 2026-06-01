import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import billingService from '#services/billing/billing_service'

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

    team.stripeSubscriptionId = active.id
    team.subscriptionStatus = active.status
    team.subscriptionCancelAtPeriodEnd = !!active.cancel_at_period_end || !!active.cancel_at
    team.subscriptionCancelExternal = !!active.cancel_at && !active.cancel_at_period_end
    const periodEnd =
      active.cancel_at ?? active.current_period_end ?? active.items?.data?.[0]?.current_period_end
    team.subscriptionCurrentPeriodEnd = periodEnd ? DateTime.fromSeconds(Number(periodEnd)) : null

    const plan = active.metadata?.plan
    if (plan === 'pro' || plan === 'team') team.plan = plan
    const period = active.metadata?.period
    if (period === 'monthly' || period === 'annual') team.planPeriod = period

    if (!active.schedule) {
      team.pendingPlan = null
      team.pendingPlanPeriod = null
    } else {
      try {
        const schedule = await billingService.retrieveSchedule(String(active.schedule))
        const pending = billingService.detectPendingChange({ schedule })
        team.pendingPlan = pending?.plan ?? null
        team.pendingPlanPeriod = pending?.period ?? null
      } catch {}
    }

    if (!team.subscriptionStartedAt) {
      team.subscriptionStartedAt = active.start_date
        ? DateTime.fromSeconds(Number(active.start_date))
        : DateTime.now()
    }
    if (active.status !== 'past_due') team.subscriptionGraceEndsAt = null

    await team.save()
    return response.ok({ synced: true, plan: team.plan, status: team.subscriptionStatus })
  }
}
