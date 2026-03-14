import type { HttpContext } from '@adonisjs/core/http'
import InvoiceSetting from '#models/team/invoice_setting'

export default class InvoiceSettingsShow {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    let settings = await InvoiceSetting.findBy('teamId', user.currentTeamId)

    if (!settings) {
      // Return defaults if no settings exist yet
      return response.ok({
        settings: {
          billingType: 'quick',
          accentColor: '#6366f1',
          logoUrl: null,
          paymentMethods: ['bank_transfer'],
          customPaymentMethod: '',
          template: 'classique',
        },
      })
    }

    return response.ok({
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
