import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import env from '#start/env'
import Team from '#models/team/team'
import billingService from '#services/billing/billing_service'

export default class StripeBillingWebhook {
  async handle({ request, response }: HttpContext) {
    const rawBody: unknown = request.raw() || ''
    const signature = request.header('stripe-signature')

    let event: any = null
    if (signature) {
      try {
        event = billingService.constructEvent(rawBody as string | Buffer, signature)
      } catch {
        event = null
      }
    }
    if (!event) {
      if (env.get('NODE_ENV') === 'production') {
        return response.badRequest({ message: 'Invalid signature' })
      }
      try {
        event = JSON.parse(typeof rawBody === 'string' ? rawBody : String(rawBody))
      } catch {
        return response.badRequest({ message: 'Invalid payload' })
      }
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
        case 'checkout.session.async_payment_succeeded':
          await this.onCheckoutCompleted(event.data.object as any)
          break
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.onSubscriptionUpdated(event.data.object as any)
          break
        case 'customer.subscription.deleted':
          await this.onSubscriptionDeleted(event.data.object as any)
          break
        case 'invoice.payment_failed':
          await this.onInvoiceFailed(event.data.object as any)
          break
        case 'invoice.paid':
        case 'invoice.payment_succeeded':
          await this.onInvoicePaid(event.data.object as any)
          break
      }
    } catch {
      return response.internalServerError({ received: false })
    }

    return response.ok({ received: true })
  }

  private async findTeam(
    metaTeamId?: string | null,
    customerId?: string | null,
    subId?: string | null
  ): Promise<Team | null> {
    if (metaTeamId) {
      const t = await Team.find(metaTeamId)
      if (t) return t
    }
    if (subId) {
      const t = await Team.query().where('stripeSubscriptionId', subId).first()
      if (t) return t
    }
    if (customerId) {
      const t = await Team.query().where('stripeCustomerId', customerId).first()
      if (t) return t
    }
    return null
  }

  private planFromMeta(meta: any): 'pro' | 'team' | null {
    const p = meta?.plan
    return p === 'pro' || p === 'team' ? p : null
  }

  private periodEnd(sub: any): DateTime | null {
    const ts =
      sub?.cancel_at ?? sub?.current_period_end ?? sub?.items?.data?.[0]?.current_period_end
    return ts ? DateTime.fromSeconds(Number(ts)) : null
  }

  private invoiceSubId(invoice: any): string | null {
    const s = invoice?.subscription ?? invoice?.parent?.subscription_details?.subscription
    return s ? String(s) : null
  }

  private async onCheckoutCompleted(session: any) {
    const team = await this.findTeam(session.metadata?.team_id, session.customer, session.subscription)
    if (!team) return
    const newSubId = session.subscription ? String(session.subscription) : null
    if (newSubId && team.stripeSubscriptionId && team.stripeSubscriptionId !== newSubId) {
      try {
        await billingService.cancelImmediately(team.stripeSubscriptionId)
      } catch {}
    }
    if (newSubId) team.stripeSubscriptionId = newSubId
    if (session.customer) team.stripeCustomerId = String(session.customer)
    const plan = this.planFromMeta(session.metadata)
    if (plan) team.plan = plan
    if (session.metadata?.period === 'monthly' || session.metadata?.period === 'annual') {
      team.planPeriod = session.metadata.period
    }
    team.subscriptionStatus = 'active'
    team.subscriptionGraceEndsAt = null
    if (!team.subscriptionStartedAt) team.subscriptionStartedAt = DateTime.now()
    await team.save()
  }

  private async onSubscriptionUpdated(sub: any) {
    const team = await this.findTeam(sub.metadata?.team_id, sub.customer, sub.id)
    if (!team) return
    const isCanceling = sub.status === 'canceled' || sub.status === 'incomplete_expired'
    if (isCanceling && team.stripeSubscriptionId && team.stripeSubscriptionId !== sub.id) {
      return
    }
    team.stripeSubscriptionId = sub.id
    team.subscriptionStatus = sub.status ?? null
    team.subscriptionCancelAtPeriodEnd = !!sub.cancel_at_period_end || !!sub.cancel_at
    team.subscriptionCurrentPeriodEnd = this.periodEnd(sub)
    const plan = this.planFromMeta(sub.metadata)
    if (sub.status === 'active' || sub.status === 'trialing') {
      if (plan) team.plan = plan
      team.subscriptionGraceEndsAt = null
      if (!team.subscriptionStartedAt) {
        team.subscriptionStartedAt = sub.start_date
          ? DateTime.fromSeconds(Number(sub.start_date))
          : DateTime.now()
      }
    } else if (sub.status === 'canceled' || sub.status === 'incomplete_expired') {
      team.plan = 'free'
      team.stripeSubscriptionId = null
      team.subscriptionGraceEndsAt = null
      team.subscriptionStartedAt = null
    } else if (sub.status === 'past_due' || sub.status === 'unpaid') {
      if (!team.subscriptionGraceEndsAt) {
        team.subscriptionGraceEndsAt = DateTime.now().plus({ days: 7 })
      }
    }
    await team.save()
  }

  private async onSubscriptionDeleted(sub: any) {
    const team = await this.findTeam(sub.metadata?.team_id, sub.customer, sub.id)
    if (!team) return
    if (team.stripeSubscriptionId && team.stripeSubscriptionId !== sub.id) return
    team.plan = 'free'
    team.subscriptionStatus = 'canceled'
    team.stripeSubscriptionId = null
    team.subscriptionGraceEndsAt = null
    team.subscriptionCancelAtPeriodEnd = false
    team.subscriptionStartedAt = null
    await team.save()
  }

  private async onInvoiceFailed(invoice: any) {
    const team = await this.findTeam(invoice.metadata?.team_id, invoice.customer, this.invoiceSubId(invoice))
    if (!team) return
    team.subscriptionStatus = 'past_due'
    if (!team.subscriptionGraceEndsAt) {
      team.subscriptionGraceEndsAt = DateTime.now().plus({ days: 7 })
    }
    await team.save()
  }

  private async onInvoicePaid(invoice: any) {
    const team = await this.findTeam(invoice.metadata?.team_id, invoice.customer, this.invoiceSubId(invoice))
    if (!team) return
    if (team.subscriptionStatus === 'past_due' || team.subscriptionStatus === 'unpaid') {
      team.subscriptionStatus = 'active'
    }
    team.subscriptionGraceEndsAt = null
    await team.save()
  }
}
