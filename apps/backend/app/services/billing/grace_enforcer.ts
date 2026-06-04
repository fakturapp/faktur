import { DateTime } from 'luxon'
import Team from '#models/team/team'
import billingService from '#services/billing/billing_service'

export async function enforceGraceForTeam(team: Team): Promise<boolean> {
  const status = team.subscriptionStatus ?? ''
  if (status !== 'past_due' && status !== 'unpaid') return false
  if (!team.subscriptionGraceEndsAt || team.subscriptionGraceEndsAt > DateTime.now()) return false

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
  team.subscriptionDunningNotifiedAt = null
  team.pendingPlan = null
  team.pendingPlanPeriod = null
  await team.save()
  return true
}

export async function enforceExpiredGrace(): Promise<number> {
  const teams = await Team.query()
    .whereIn('subscriptionStatus', ['past_due', 'unpaid'])
    .whereNotNull('subscriptionGraceEndsAt')

  let downgraded = 0
  for (const team of teams) {
    if (await enforceGraceForTeam(team)) downgraded++
  }

  return downgraded
}
