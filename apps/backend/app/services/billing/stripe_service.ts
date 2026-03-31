import Stripe from 'stripe'
import env from '#start/env'
import Subscription from '#models/billing/subscription'

class StripeService {
  private getStripe(): Stripe {
    const isProd = env.get('NODE_ENV') === 'production'
    const key = isProd ? env.get('STRIPE_SECRET_KEY_PROD') : env.get('STRIPE_SECRET_KEY_DEV')
    if (!key) {
      throw new Error('Stripe secret key not configured')
    }
    return new Stripe(key)
  }

  private getWebhookSecret(): string {
    const isProd = env.get('NODE_ENV') === 'production'
    const secret = isProd
      ? env.get('STRIPE_WEBHOOK_SECRET_PROD')
      : env.get('STRIPE_WEBHOOK_SECRET_DEV')
    if (!secret) {
      throw new Error('Stripe webhook secret not configured')
    }
    return secret
  }

  async getOrCreateCustomer(userId: string, email: string): Promise<string> {
    const sub = await Subscription.findBy('userId', userId)
    if (sub?.stripeCustomerId) {
      return sub.stripeCustomerId
    }

    const stripe = this.getStripe()
    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
    })

    if (sub) {
      sub.stripeCustomerId = customer.id
      await sub.save()
    } else {
      await Subscription.create({
        userId,
        stripeCustomerId: customer.id,
        planName: 'free',
        status: 'active',
        cancelAtPeriodEnd: false,
      })
    }

    return customer.id
  }

  async createCheckoutSession(userId: string, email: string): Promise<string> {
    const priceId = env.get('STRIPE_AI_PRO_PRICE_ID')
    if (!priceId) {
      throw new Error('STRIPE_AI_PRO_PRICE_ID not configured')
    }

    const customerId = await this.getOrCreateCustomer(userId, email)
    const stripe = this.getStripe()
    const frontendUrl = env.get('FRONTEND_URL') || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/dashboard/settings/fakturai/manage?success=true`,
      cancel_url: `${frontendUrl}/dashboard/settings/fakturai/manage?canceled=true`,
      client_reference_id: userId,
    })

    return session.url!
  }

  async createPortalSession(stripeCustomerId: string): Promise<string> {
    const stripe = this.getStripe()
    const frontendUrl = env.get('FRONTEND_URL') || 'http://localhost:3000'

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${frontendUrl}/dashboard/settings/fakturai/manage`,
    })

    return session.url
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): Stripe.Event {
    const stripe = this.getStripe()
    const secret = this.getWebhookSecret()
    return stripe.webhooks.constructEvent(rawBody, signature, secret)
  }
}

export default new StripeService()
