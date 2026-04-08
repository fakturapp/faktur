import type { HttpContext } from '@adonisjs/core/http'
import PaymentLink from '#models/invoice/payment_link'
import encryptionService from '#services/encryption/encryption_service'
import stripeService from '#services/stripe/stripe_service'

export default class CheckoutCreateIntent {
  async handle({ params, response }: HttpContext) {
    response.header('X-Robots-Tag', 'noindex, nofollow')
    response.header('Cache-Control', 'no-store, no-cache, must-revalidate')

    const tokenHash = encryptionService.hash(params.token)

    const paymentLink = await PaymentLink.query()
      .where('token_hash', tokenHash)
      .where('is_active', true)
      .first()

    if (!paymentLink || paymentLink.isExpired) {
      return response.notFound({ message: 'Payment link not found or expired' })
    }

    if (paymentLink.paidAt) {
      return response.conflict({ message: 'Payment already completed' })
    }

    if (paymentLink.paymentMethod !== 'stripe') {
      return response.badRequest({ message: 'This payment link does not support Stripe' })
    }

    if (!paymentLink.encryptedStripeSecretKey || !paymentLink.encryptedStripePublishableKey) {
      return response.badRequest({ message: 'Stripe is not configured for this payment link' })
    }

    let secretKey: string
    let publishableKey: string
    try {
      secretKey = encryptionService.decrypt(paymentLink.encryptedStripeSecretKey)
      publishableKey = encryptionService.decrypt(paymentLink.encryptedStripePublishableKey)
    } catch {
      return response.internalServerError({ message: 'Failed to decrypt Stripe keys' })
    }

    if (paymentLink.stripePaymentIntentId) {
      try {
        const stripe = stripeService.getClient(secretKey)
        const existingPi = await stripe.paymentIntents.retrieve(paymentLink.stripePaymentIntentId)
        if (existingPi.status === 'requires_payment_method' || existingPi.status === 'requires_action') {
          return response.ok({
            clientSecret: existingPi.client_secret,
            publishableKey,
          })
        }
      } catch {
      }
    }

    try {
      const pi = await stripeService.createPaymentIntent(secretKey, {
        amount: Number(paymentLink.amount),
        currency: paymentLink.currency,
        metadata: {
          payment_link_id: paymentLink.id,
          team_id: paymentLink.teamId,
          invoice_number: paymentLink.invoiceNumber,
        },
        description: `Facture ${paymentLink.invoiceNumber}`,
      })

      paymentLink.stripePaymentIntentId = pi.id
      paymentLink.stripeStatus = pi.status
      await paymentLink.save()

      return response.ok({
        clientSecret: pi.client_secret,
        publishableKey,
      })
    } catch (err: any) {
      return response.internalServerError({
        message: err.message || 'Failed to create payment intent',
      })
    }
  }
}
