import type { HttpContext } from '@adonisjs/core/http'
import stripeService from '#services/billing/stripe_service'

export default class Checkout {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!

    try {
      const url = await stripeService.createCheckoutSession(user.id, user.email)
      return response.ok({ url })
    } catch (error: any) {
      return response.internalServerError({ message: error.message || 'Checkout failed' })
    }
  }
}
