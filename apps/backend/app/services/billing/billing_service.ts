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

  async createCheckoutSession(params: {
    team: Team
    customerId: string
    plan: BillingPlan
    period: BillingPeriod
    returnUrl: string
  }): Promise<Stripe.Checkout.Session> {
    const { unitAmount, interval } = this.priceFor(params.plan, params.period)
    const ref = this.productRef(params.plan, params.period)
    const metadata = { team_id: params.team.id, plan: params.plan, period: params.period }

    let lineItem: Record<string, any>
    if (ref && ref.startsWith('price_')) {
      lineItem = { price: ref, quantity: 1 }
    } else {
      const priceData: Record<string, any> = {
        currency: 'eur',
        unit_amount: unitAmount,
        recurring: { interval },
      }
      if (ref) priceData.product = ref
      else priceData.product_data = { name: PRODUCT_NAMES[params.plan] }
      lineItem = { quantity: 1, price_data: priceData }
    }

    return this.client().checkout.sessions.create({
      mode: 'subscription',
      ui_mode: 'elements',
      customer: params.customerId,
      line_items: [lineItem] as any,
      subscription_data: { metadata },
      metadata,
      return_url: params.returnUrl,
    })
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

  constructEvent(rawBody: string | Buffer, signature: string): Stripe.Event {
    const secret = env.get('STRIPE_BILLING_WEBHOOK_SECRET')
    if (!secret) throw new Error('Stripe billing webhook secret is not configured')
    return stripeService.constructWebhookEvent(rawBody, signature, secret)
  }
}

export default new BillingService()
