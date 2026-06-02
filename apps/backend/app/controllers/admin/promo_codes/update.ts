import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import billingService from '#services/billing/billing_service'

const updateValidator = vine.compile(vine.object({ active: vine.boolean() }))

export default class UpdatePromoCode {
  async handle({ params, request, response }: HttpContext) {
    if (!billingService.isConfigured()) {
      return response.serviceUnavailable({ message: "Le paiement n'est pas encore configuré." })
    }
    const { active } = await request.validateUsing(updateValidator)
    try {
      await billingService.setPromotionCodeActive(params.id, active)
      return response.ok({ ok: true })
    } catch (err: any) {
      return response.badRequest({ message: err?.message || 'Mise à jour impossible' })
    }
  }
}
