import Stripe from 'stripe'

class StripeService {
  getClient(secretKey: string): Stripe {
    return new Stripe(secretKey, { apiVersion: '2026-03-25.dahlia' })
  }

  async validateKeys(
    publishableKey: string,
    secretKey: string
  ): Promise<{ valid: boolean; error?: string }> {
    if (!publishableKey.startsWith('pk_live_') && !publishableKey.startsWith('pk_test_')) {
      return { valid: false, error: 'La clé publique doit commencer par pk_live_ ou pk_test_' }
    }
    if (!secretKey.startsWith('sk_live_') && !secretKey.startsWith('sk_test_')) {
      return { valid: false, error: 'La clé secrète doit commencer par sk_live_ ou sk_test_' }
    }

    try {
      const stripe = this.getClient(secretKey)
      await stripe.balance.retrieve()
      return { valid: true }
    } catch (err: any) {
      if (err.type === 'StripeAuthenticationError') {
        return { valid: false, error: 'Clé secrète invalide. Vérifiez vos clés Stripe.' }
      }
      return { valid: false, error: err.message || 'Erreur de connexion à Stripe' }
    }
  }

  async createPaymentIntent(
    secretKey: string,
    params: {
      amount: number
      currency: string
      metadata: Record<string, string>
      description?: string
    }
  ): Promise<Stripe.PaymentIntent> {
    const stripe = this.getClient(secretKey)
    return stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100),
      currency: params.currency.toLowerCase(),
      metadata: params.metadata,
      description: params.description,
      automatic_payment_methods: { enabled: true },
    })
  }

  constructWebhookEvent(
    rawBody: string | Buffer,
    signature: string,
    webhookSecret: string
  ): Stripe.Event {
    const stripe = new Stripe('', { apiVersion: '2026-03-25.dahlia' })
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  }
}

export default new StripeService()
