import type { HttpContext } from '@adonisjs/core/http'
import Subscription from '#models/billing/subscription'
import stripeService from '#services/billing/stripe_service'

export default class Portal {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!

    const sub = await Subscription.findBy('userId', user.id)
    if (!sub?.stripeCustomerId) {
      return response.badRequest({ message: 'No Stripe customer found. Subscribe first.' })
    }

    try {
      const url = await stripeService.createPortalSession(sub.stripeCustomerId)
      return response.ok({ url })
    } catch (error: any) {
      return response.internalServerError({ message: error.message || 'Portal session failed' })
    }
  }
}
