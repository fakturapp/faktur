import type { HttpContext } from '@adonisjs/core/http'
import InvoiceSetting from '#models/team/invoice_setting'
import { updateInvoiceSettingsValidator } from '#validators/invoice_settings_validator'

export default class InvoiceSettingsUpdate {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const payload = await request.validateUsing(updateInvoiceSettingsValidator)

    let settings = await InvoiceSetting.findBy('teamId', user.currentTeamId)

    if (!settings) {
      settings = await InvoiceSetting.create({
        teamId: user.currentTeamId,
        billingType: payload.billingType,
        accentColor: payload.accentColor,
        paymentMethods: payload.paymentMethods,
        customPaymentMethod: payload.customPaymentMethod || null,
        template: payload.template || 'classique',
      })
    } else {
      settings.billingType = payload.billingType
      settings.accentColor = payload.accentColor
      settings.paymentMethods = payload.paymentMethods
      settings.customPaymentMethod = payload.customPaymentMethod || null
      if (payload.template) settings.template = payload.template
      await settings.save()
    }

    return response.ok({
      message: 'Invoice settings updated',
      settings: {
        billingType: settings.billingType,
        accentColor: settings.accentColor,
        logoUrl: settings.logoUrl,
        paymentMethods: settings.paymentMethods,
        customPaymentMethod: settings.customPaymentMethod || '',
        template: settings.template || 'classique',
      },
    })
  }
}
