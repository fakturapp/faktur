import env from '#start/env'
import stripeService from '#services/stripe/stripe_service'
import type Stripe from 'stripe'
import type Team from '#models/team/team'

export type BillingPlan = 'pro' | 'team'
export type BillingPeriod = 'monthly' | 'annual'

const PRICES: Record<BillingPlan, Record<BillingPeriod, number>> = {
  pro: { monthly: 799, annual: 5988 },
  team: { monthly: 1499, annual: 14388 },
}

const PRODUCT_NAMES: Record<BillingPlan, string> = {
  pro: 'Faktur Pro',
  team: 'Faktur Team',
}

class BillingService {
  isConfigured(): boolean {
    return !!env.get('STRIPE_SECRET_KEY')
  }

  publishableKey(): string {
    return env.get('STRIPE_PUBLISHABLE_KEY') ?? ''
  }

  client(): Stripe {
    const key = env.get('STRIPE_SECRET_KEY')
    if (!key) throw new Error('Stripe billing is not configured')
    return stripeService.getClient(key)
  }

  priceFor(plan: BillingPlan, period: BillingPeriod): { unitAmount: number; interval: 'month' | 'year' } {
    return { unitAmount: PRICES[plan][period], interval: period === 'annual' ? 'year' : 'month' }
  }

  subscriptionPeriod(sub: any): { start: number | null; end: number | null } {
    const item = sub?.items?.data?.[0]
    const start = sub?.current_period_start ?? item?.current_period_start ?? sub?.start_date ?? null
    const end = sub?.current_period_end ?? item?.current_period_end ?? null
    return { start: start ? Number(start) : null, end: end ? Number(end) : null }
  }

  computeUnusedCredit(params: {
    plan: BillingPlan
    period: BillingPeriod
    periodStart: number | null
    periodEnd: number | null
    nowSeconds: number
  }): number {
    const { plan, period, periodStart, periodEnd, nowSeconds } = params
    if (!periodStart || !periodEnd || periodEnd <= periodStart) return 0
    const paid = PRICES[plan][period]
    const total = periodEnd - periodStart
    const remaining = Math.max(0, Math.min(total, periodEnd - nowSeconds))
    return Math.round((paid * remaining) / total)
  }

  async retrieveSubscription(id: string): Promise<Stripe.Subscription> {
    return this.client().subscriptions.retrieve(id)
  }

  async createUnusedTimeCoupon(params: {
    currentPlan: BillingPlan
    currentPeriod: BillingPeriod
    targetPlan: BillingPlan
    targetPeriod: BillingPeriod
    subscription: any
    teamId: string
  }): Promise<{ couponId: string; amountOff: number } | null> {
    const { start, end } = this.subscriptionPeriod(params.subscription)
    const credit = this.computeUnusedCredit({
      plan: params.currentPlan,
      period: params.currentPeriod,
      periodStart: start,
      periodEnd: end,
      nowSeconds: Math.floor(Date.now() / 1000),
    })
    if (credit < 1) return null

    const targetCharge = PRICES[params.targetPlan][params.targetPeriod]
    const amountOff = Math.min(credit, targetCharge)
    if (amountOff < 1) return null

    const coupon = await this.client().coupons.create({
      amount_off: amountOff,
      currency: 'eur',
      duration: 'once',
      max_redemptions: 1,
      name: `Crédit ${PRODUCT_NAMES[params.currentPlan]} (temps restant)`,
      metadata: {
        team_id: params.teamId,
        kind: 'plan_switch_credit',
        from_plan: params.currentPlan,
        to_plan: params.targetPlan,
      },
    })
    return { couponId: coupon.id, amountOff }
  }

  async ensureCustomer(team: Team, email: string): Promise<string> {
    if (team.stripeCustomerId) return team.stripeCustomerId
    const customer = await this.client().customers.create({
      email,
      name: team.name,
      metadata: { team_id: team.id },
    })
    team.stripeCustomerId = customer.id
    await team.save()
    return customer.id
  }

  productRef(plan: BillingPlan, period: BillingPeriod): string | undefined {
    const refs: Record<BillingPlan, Record<BillingPeriod, string | undefined>> = {
      pro: {
        monthly: env.get('STRIPE_PRODUCT_PRO_MONTHLY'),
        annual: env.get('STRIPE_PRODUCT_PRO_YEARLY'),
      },
      team: {
        monthly: env.get('STRIPE_PRODUCT_TEAM_MONTHLY'),
        annual: env.get('STRIPE_PRODUCT_TEAM_YEARLY'),
      },
    }
    return refs[plan][period] || undefined
  }

  buildLineItem(plan: BillingPlan, period: BillingPeriod): Record<string, any> {
    const { unitAmount, interval } = this.priceFor(plan, period)
    const ref = this.productRef(plan, period)
    if (ref && ref.startsWith('price_')) {
      return { price: ref }
    }
    const priceData: Record<string, any> = {
      currency: 'eur',
      unit_amount: unitAmount,
      recurring: { interval },
    }
    if (ref) priceData.product = ref
    else priceData.product_data = { name: PRODUCT_NAMES[plan] }
    return { price_data: priceData }
  }

  async createCheckoutSession(params: {
    team: Team
    customerId: string
    plan: BillingPlan
    period: BillingPeriod
    returnUrl: string
    couponId?: string
  }): Promise<Stripe.Checkout.Session> {
    const metadata = { team_id: params.team.id, plan: params.plan, period: params.period }
    const lineItem = { ...this.buildLineItem(params.plan, params.period), quantity: 1 }

    const sessionParams: Record<string, any> = {
      mode: 'subscription',
      ui_mode: 'elements',
      customer: params.customerId,
      line_items: [lineItem],
      subscription_data: { metadata },
      metadata,
      return_url: params.returnUrl,
    }
    if (params.couponId) sessionParams.discounts = [{ coupon: params.couponId }]

    return this.client().checkout.sessions.create(sessionParams as any)
  }

  async retrieveCheckoutSession(id: string): Promise<Stripe.Checkout.Session> {
    return this.client().checkout.sessions.retrieve(id)
  }

  async createPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    return this.client().billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })
  }

  async setCancelAtPeriodEnd(subscriptionId: string, cancel: boolean): Promise<Stripe.Subscription> {
    if (cancel) {
      return this.client().subscriptions.update(subscriptionId, { cancel_at_period_end: true })
    }
    return this.client().subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
      cancel_at: '',
    } as any)
  }

  async listInvoices(customerId: string): Promise<Stripe.Invoice[]> {
    const res = await this.client().invoices.list({ customer: customerId, limit: 24 })
    return res.data
  }

  async listSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    const res = await this.client().subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    })
    return res.data
  }

  async cancelImmediately(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.client().subscriptions.cancel(subscriptionId)
  }

  async scheduleChangeAtPeriodEnd(params: {
    subscriptionId: string
    currentPlan: BillingPlan
    currentPeriod: BillingPeriod
    targetPlan: BillingPlan
    targetPeriod: BillingPeriod
    teamId: string
  }): Promise<{ scheduleId: string; effectiveAt: number | null }> {
    const client = this.client()
    const sub: any = await client.subscriptions.retrieve(params.subscriptionId)

    let scheduleId: string | null = sub?.schedule ? String(sub.schedule) : null
    if (!scheduleId) {
      const created = await client.subscriptionSchedules.create({
        from_subscription: params.subscriptionId,
      })
      scheduleId = created.id
    }

    const schedule: any = await client.subscriptionSchedules.retrieve(scheduleId)
    const period = this.subscriptionPeriod(sub)
    const currentPriceId = sub?.items?.data?.[0]?.price?.id ?? undefined
    const start = schedule?.current_phase?.start_date ?? period.start ?? undefined
    const end = schedule?.current_phase?.end_date ?? period.end ?? undefined

    const currentItem = currentPriceId
      ? { price: currentPriceId, quantity: 1 }
      : { ...this.buildLineItem(params.currentPlan, params.currentPeriod), quantity: 1 }

    await client.subscriptionSchedules.update(scheduleId, {
      end_behavior: 'release',
      proration_behavior: 'none',
      phases: [
        {
          items: [currentItem],
          start_date: start,
          end_date: end,
          metadata: {
            team_id: params.teamId,
            plan: params.currentPlan,
            period: params.currentPeriod,
          },
        },
        {
          items: [{ ...this.buildLineItem(params.targetPlan, params.targetPeriod), quantity: 1 }],
          metadata: {
            team_id: params.teamId,
            plan: params.targetPlan,
            period: params.targetPeriod,
          },
        },
      ],
    } as any)

    return { scheduleId, effectiveAt: end ? Number(end) : null }
  }

  async retrieveSchedule(scheduleId: string): Promise<Stripe.SubscriptionSchedule> {
    return this.client().subscriptionSchedules.retrieve(scheduleId)
  }

  async releaseScheduledChange(subscriptionId: string): Promise<void> {
    const client = this.client()
    const sub: any = await client.subscriptions.retrieve(subscriptionId)
    const scheduleId = sub?.schedule ? String(sub.schedule) : null
    if (scheduleId) {
      try {
        await client.subscriptionSchedules.release(scheduleId)
      } catch {}
    }
  }

  detectPendingChange(sub: any): { plan: BillingPlan; period: BillingPeriod } | null {
    const phases: any[] = sub?.schedule?.phases ?? []
    if (phases.length < 2) return null
    const future = phases[phases.length - 1]
    const plan = future?.metadata?.plan
    const period = future?.metadata?.period
    if ((plan === 'pro' || plan === 'team') && (period === 'monthly' || period === 'annual')) {
      return { plan, period }
    }
    return null
  }

  constructEvent(rawBody: string | Buffer, signature: string): Stripe.Event {
    const secret = env.get('STRIPE_BILLING_WEBHOOK_SECRET')
    if (!secret) throw new Error('Stripe billing webhook secret is not configured')
    return stripeService.constructWebhookEvent(rawBody, signature, secret)
  }
}

export default new BillingService()
