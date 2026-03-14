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
        darkMode: payload.darkMode ?? false,
        documentFont: payload.documentFont || 'Lexend',
        eInvoicingEnabled: payload.eInvoicingEnabled ?? false,
        pdpProvider: payload.pdpProvider || null,
        pdpApiKey: payload.pdpApiKey || null,
        pdpSandbox: payload.pdpSandbox ?? true,
      })
    } else {
      settings.billingType = payload.billingType
      settings.accentColor = payload.accentColor
      settings.paymentMethods = payload.paymentMethods
      settings.customPaymentMethod = payload.customPaymentMethod || null
      if (payload.template) settings.template = payload.template
      if (payload.darkMode !== undefined) settings.darkMode = payload.darkMode
      if (payload.documentFont) settings.documentFont = payload.documentFont
      if (payload.eInvoicingEnabled !== undefined) settings.eInvoicingEnabled = payload.eInvoicingEnabled
      if (payload.pdpProvider !== undefined) settings.pdpProvider = payload.pdpProvider || null
      if (payload.pdpApiKey !== undefined && payload.pdpApiKey !== '••••••••') {
        settings.pdpApiKey = payload.pdpApiKey || null
      }
      if (payload.pdpSandbox !== undefined) settings.pdpSandbox = payload.pdpSandbox
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
        darkMode: settings.darkMode || false,
        documentFont: settings.documentFont || 'Lexend',
        eInvoicingEnabled: settings.eInvoicingEnabled || false,
        pdpProvider: settings.pdpProvider || null,
        pdpApiKey: settings.pdpApiKey ? '••••••••' : null,
        pdpSandbox: settings.pdpSandbox ?? true,
      },
    })
  }
}
