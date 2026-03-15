import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import InvoiceSetting from '#models/team/invoice_setting'

const personalizeValidator = vine.compile(
  vine.object({
    template: vine.string().trim().maxLength(30).optional(),
    accentColor: vine.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    billingType: vine.enum(['quick', 'detailed']).optional(),
    vatExemptReason: vine.enum(['none', 'not_subject', 'france_no_vat', 'outside_france']).optional(),
  })
)

export default class CompletePersonalization {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.badRequest({ message: 'You must create a team first' })
    }

    const payload = await request.validateUsing(personalizeValidator)

    let settings = await InvoiceSetting.findBy('teamId', user.currentTeamId)

    if (!settings) {
      settings = await InvoiceSetting.create({
        teamId: user.currentTeamId,
        template: payload.template || 'classique',
        accentColor: payload.accentColor || '#6366f1',
        billingType: payload.billingType || 'quick',
        paymentMethods: ['bank_transfer'],
        darkMode: false,
        documentFont: 'Lexend',
        eInvoicingEnabled: false,
        pdpSandbox: true,
        defaultShowNotes: true,
        defaultSignatureField: false,
        defaultVatExempt: payload.vatExemptReason === 'not_subject',
        defaultShowDeliveryAddress: false,
        defaultLanguage: 'fr',
      })
    } else {
      if (payload.template) settings.template = payload.template
      if (payload.accentColor) settings.accentColor = payload.accentColor
      if (payload.billingType) settings.billingType = payload.billingType
      if (payload.vatExemptReason !== undefined) settings.defaultVatExempt = payload.vatExemptReason === 'not_subject'
      await settings.save()
    }

    user.onboardingCompleted = true
    await user.save()

    return response.ok({ message: 'Onboarding completed' })
  }
}
