import type { HttpContext } from '@adonisjs/core/http'
import billingService from '#services/billing/billing_service'

export default class ListPromoCodes {
  async handle({ response }: HttpContext) {
    if (!billingService.isConfigured()) {
      return response.ok({ promoCodes: [], configured: false })
    }
    try {
      const promoCodes = await billingService.listPromotionCodes()
      return response.ok({ promoCodes, configured: true })
    } catch (err: any) {
      return response.badRequest({ message: err?.message || 'Chargement impossible' })
    }
  }
}
