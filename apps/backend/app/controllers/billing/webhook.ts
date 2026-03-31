import type { HttpContext } from '@adonisjs/core/http'
import type Stripe from 'stripe'
import { DateTime } from 'luxon'
import stripeService from '#services/billing/stripe_service'
import Subscription from '#models/billing/subscription'

export default class Webhook {
  async handle({ request, response }: HttpContext) {
    const signature = request.header('stripe-signature')
    if (!signature) {
      return response.badRequest({ message: 'Missing stripe-signature header' })
    }

    let event: Stripe.Event
    try {
      const rawBody = request.raw() || ''
      event = stripeService.verifyWebhookSignature(
        Buffer.from(rawBody),
        signature
      )
    } catch (error: any) {
      return response.badRequest({ message: `Webhook signature verification failed: ${error.message}` })
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
          break
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
          break
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          break
        case 'invoice.payment_failed':
          // Log but don't change plan — Stripe will retry
          console.warn('[stripe] invoice.payment_failed', (event.data.object as any).id)
          break
      }
    } catch (error: any) {
      console.error(`[stripe] Error processing ${event.type}:`, error.message)
    }

    return response.ok({ received: true })
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.client_reference_id
    if (!userId || session.mode !== 'subscription') return

    const stripeSubscriptionId = session.subscription as string
    const stripeCustomerId = session.customer as string

    let sub = await Subscription.findBy('userId', userId)
    if (sub) {
      sub.stripeCustomerId = stripeCustomerId
      sub.stripeSubscriptionId = stripeSubscriptionId
      sub.planName = 'ai_pro'
      sub.status = 'active'
      sub.cancelAtPeriodEnd = false
      sub.canceledAt = null
      await sub.save()
    } else {
      await Subscription.create({
        userId,
        stripeCustomerId,
        stripeSubscriptionId,
        planName: 'ai_pro',
        status: 'active',
        cancelAtPeriodEnd: false,
      })
    }
  }

  private async handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
    const sub = await Subscription.findBy('stripeSubscriptionId', stripeSub.id)
    if (!sub) return

    sub.status = stripeSub.status === 'active' ? 'active' : stripeSub.status
    sub.cancelAtPeriodEnd = stripeSub.cancel_at_period_end
    sub.currentPeriodStart = DateTime.fromSeconds(stripeSub.current_period_start)
    sub.currentPeriodEnd = DateTime.fromSeconds(stripeSub.current_period_end)

    if (stripeSub.cancel_at_period_end && stripeSub.canceled_at) {
      sub.canceledAt = DateTime.fromSeconds(stripeSub.canceled_at)
    }

    // If subscription is no longer active (past_due, unpaid, etc.)
    if (!['active', 'trialing'].includes(stripeSub.status)) {
      sub.planName = 'free'
    }

    await sub.save()
  }

  private async handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
    const sub = await Subscription.findBy('stripeSubscriptionId', stripeSub.id)
    if (!sub) return

    sub.planName = 'free'
    sub.status = 'active'
    sub.cancelAtPeriodEnd = false
    sub.canceledAt = DateTime.now()
    await sub.save()
  }
}
