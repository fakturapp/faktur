import { DateTime } from 'luxon'
import type Team from '#models/team/team'
import billingService from '#services/billing/billing_service'

function metaPlan(meta: any): 'pro' | 'team' | null {
  return meta?.plan === 'pro' || meta?.plan === 'team' ? meta.plan : null
}

function metaPeriod(meta: any): 'monthly' | 'annual' | null {
  return meta?.period === 'monthly' || meta?.period === 'annual' ? meta.period : null
}

export function applyStripeSubscription(team: Team, sub: any, schedule?: any): void {
  const status = String(sub?.status ?? '')

  team.stripeSubscriptionId = sub.id
  if (sub.customer) team.stripeCustomerId = String(sub.customer)
  team.subscriptionStatus = status || null
  team.subscriptionCancelAtPeriodEnd = !!sub.cancel_at_period_end || !!sub.cancel_at
  team.subscriptionCancelExternal = !!sub.cancel_at && !sub.cancel_at_period_end
  team.subscriptionPaused = !!sub.pause_collection || status === 'paused'

  const plan = metaPlan(sub.metadata)
  if (plan) team.plan = plan
  const period = metaPeriod(sub.metadata)
  if (period) team.planPeriod = period

  let scheduleSwitchTs: number | null = null
  if (!sub.schedule) {
    team.pendingPlan = null
    team.pendingPlanPeriod = null
  } else if (schedule) {
    const pending = billingService.detectPendingChange({ schedule })
    team.pendingPlan = pending?.plan ?? null
    team.pendingPlanPeriod = pending?.period ?? null
    if (pending && schedule?.current_phase?.end_date) {
      scheduleSwitchTs = Number(schedule.current_phase.end_date)
    }
  }
  if (team.pendingPlan && team.plan === team.pendingPlan) {
    team.pendingPlan = null
    team.pendingPlanPeriod = null
  }

  const periodInfo = billingService.subscriptionPeriod(sub)
  const endTs = sub.cancel_at ?? scheduleSwitchTs ?? periodInfo.end
  team.subscriptionCurrentPeriodEnd = endTs ? DateTime.fromSeconds(Number(endTs)) : null

  team.subscriptionStartedAt = sub.start_date ? DateTime.fromSeconds(Number(sub.start_date)) : null

  if (status === 'active' || status === 'trialing') {
    team.subscriptionGraceEndsAt = null
    team.subscriptionDunningNotifiedAt = null
  } else if (status === 'past_due' || status === 'unpaid') {
    if (!team.subscriptionGraceEndsAt) {
      team.subscriptionGraceEndsAt = DateTime.now().plus({ days: 7 })
    }
  } else if (status === 'canceled' || status === 'incomplete_expired') {
    team.plan = 'free'
    team.stripeSubscriptionId = null
    team.subscriptionStartedAt = null
    team.subscriptionGraceEndsAt = null
    team.subscriptionCancelAtPeriodEnd = false
    team.subscriptionCancelExternal = false
    team.subscriptionPaused = false
    team.subscriptionDunningNotifiedAt = null
    team.pendingPlan = null
    team.pendingPlanPeriod = null
  }
}
