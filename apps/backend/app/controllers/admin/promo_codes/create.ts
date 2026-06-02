import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import billingService from '#services/billing/billing_service'

const createValidator = vine.compile(
  vine.object({
    code: vine.string().trim().minLength(2).maxLength(40),
    discountType: vine.enum(['percent', 'amount'] as const),
    value: vine.number().positive(),
    duration: vine.enum(['once', 'forever', 'repeating'] as const),
    durationInMonths: vine.number().positive().optional(),
    plans: vine.array(vine.enum(['pro', 'team'] as const)).optional(),
    expiresAt: vine.number().positive().optional(),
    maxRedemptions: vine.number().positive().optional(),
  })
)

export default class CreatePromoCode {
  async handle({ request, response }: HttpContext) {
    if (!billingService.isConfigured()) {
      return response.serviceUnavailable({ message: "Le paiement n'est pas encore configuré." })
    }

    const payload = await request.validateUsing(createValidator)

    if (payload.discountType === 'percent' && (payload.value <= 0 || payload.value > 100)) {
      return response.unprocessableEntity({ message: 'Le pourcentage doit être compris entre 1 et 100.' })
    }

    const value =
      payload.discountType === 'amount' ? Math.round(payload.value * 100) : Math.round(payload.value)

    try {
      const promo = await billingService.createPromotionCode({
        code: payload.code.toUpperCase().replace(/\s+/g, ''),
        discountType: payload.discountType,
        value,
        duration: payload.duration,
        durationInMonths: payload.durationInMonths ?? null,
        plans: payload.plans,
        expiresAt: payload.expiresAt ?? null,
        maxRedemptions: payload.maxRedemptions ?? null,
      })
      return response.created({ promo })
    } catch (err: any) {
      return response.badRequest({ message: err?.message || 'Création du code promo impossible' })
    }
  }
}
