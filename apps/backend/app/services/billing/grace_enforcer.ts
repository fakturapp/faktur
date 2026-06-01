import { DateTime } from 'luxon'
import Team from '#models/team/team'
import billingService from '#services/billing/billing_service'

export async function enforceExpiredGrace(): Promise<number> {
  const teams = await Team.query()
    .whereIn('subscriptionStatus', ['past_due', 'unpaid'])
    .whereNotNull('subscriptionGraceEndsAt')

  const now = DateTime.now()
  let downgraded = 0

  for (const team of teams) {
    if (!team.subscriptionGraceEndsAt || team.subscriptionGraceEndsAt > now) continue

    if (team.stripeSubscriptionId && billingService.isConfigured()) {
      try {
        await billingService.cancelImmediately(team.stripeSubscriptionId)
      } catch {}
    }

    team.plan = 'free'
    team.subscriptionStatus = 'canceled'
    team.stripeSubscriptionId = null
    team.subscriptionGraceEndsAt = null
    team.subscriptionCancelAtPeriodEnd = false
    team.subscriptionCancelExternal = false
    team.subscriptionStartedAt = null
    team.pendingPlan = null
    team.pendingPlanPeriod = null
    await team.save()
    downgraded++
  }

  return downgraded
}
