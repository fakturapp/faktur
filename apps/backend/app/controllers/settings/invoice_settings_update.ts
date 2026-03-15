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
        logoSource: payload.logoSource || 'custom',
        customPaymentMethod: payload.customPaymentMethod || null,
        template: payload.template || 'classique',
        darkMode: payload.darkMode ?? false,
        documentFont: payload.documentFont || 'Lexend',
        eInvoicingEnabled: payload.eInvoicingEnabled ?? false,
        pdpProvider: payload.pdpProvider || null,
        pdpApiKey: payload.pdpApiKey || null,
        pdpSandbox: payload.pdpSandbox ?? true,
        defaultSubject: payload.defaultSubject || null,
        defaultAcceptanceConditions: payload.defaultAcceptanceConditions || null,
        defaultSignatureField: payload.defaultSignatureField ?? false,
        defaultFreeField: payload.defaultFreeField || null,
        defaultShowNotes: payload.defaultShowNotes ?? true,
        defaultVatExempt: payload.defaultVatExempt ?? false,
        defaultFooterText: payload.defaultFooterText || null,
        defaultShowDeliveryAddress: payload.defaultShowDeliveryAddress ?? false,
        defaultLanguage: payload.defaultLanguage || 'fr',
        quoteFilenamePattern: payload.quoteFilenamePattern || 'DEV-{numero}',
        invoiceFilenamePattern: payload.invoiceFilenamePattern || 'FAC-{numero}',
      })
    } else {
      settings.billingType = payload.billingType
      settings.accentColor = payload.accentColor
      settings.paymentMethods = payload.paymentMethods
      settings.customPaymentMethod = payload.customPaymentMethod || null
      if (payload.logoSource !== undefined) settings.logoSource = payload.logoSource || 'custom'
      if (payload.template) settings.template = payload.template
      if (payload.darkMode !== undefined) settings.darkMode = payload.darkMode
      if (payload.documentFont) settings.documentFont = payload.documentFont
      if (payload.eInvoicingEnabled !== undefined) settings.eInvoicingEnabled = payload.eInvoicingEnabled
      if (payload.pdpProvider !== undefined) settings.pdpProvider = payload.pdpProvider || null
      if (payload.pdpApiKey !== undefined && payload.pdpApiKey !== '••••••••') {
        settings.pdpApiKey = payload.pdpApiKey || null
      }
      if (payload.pdpSandbox !== undefined) settings.pdpSandbox = payload.pdpSandbox
      if (payload.defaultSubject !== undefined) settings.defaultSubject = payload.defaultSubject || null
      if (payload.defaultAcceptanceConditions !== undefined) settings.defaultAcceptanceConditions = payload.defaultAcceptanceConditions || null
      if (payload.defaultSignatureField !== undefined) settings.defaultSignatureField = payload.defaultSignatureField
      if (payload.defaultFreeField !== undefined) settings.defaultFreeField = payload.defaultFreeField || null
      if (payload.defaultShowNotes !== undefined) settings.defaultShowNotes = payload.defaultShowNotes
      if (payload.defaultVatExempt !== undefined) settings.defaultVatExempt = payload.defaultVatExempt
      if (payload.defaultFooterText !== undefined) settings.defaultFooterText = payload.defaultFooterText || null
      if (payload.defaultShowDeliveryAddress !== undefined) settings.defaultShowDeliveryAddress = payload.defaultShowDeliveryAddress
      if (payload.defaultLanguage !== undefined) settings.defaultLanguage = payload.defaultLanguage || 'fr'
      if (payload.quoteFilenamePattern !== undefined) settings.quoteFilenamePattern = payload.quoteFilenamePattern || 'DEV-{numero}'
      if (payload.invoiceFilenamePattern !== undefined) settings.invoiceFilenamePattern = payload.invoiceFilenamePattern || 'FAC-{numero}'
      await settings.save()
    }

    return response.ok({
      message: 'Invoice settings updated',
      settings: {
        billingType: settings.billingType,
        accentColor: settings.accentColor,
        logoUrl: settings.logoUrl,
        logoSource: settings.logoSource || 'custom',
        paymentMethods: settings.paymentMethods,
        customPaymentMethod: settings.customPaymentMethod || '',
        template: settings.template || 'classique',
        darkMode: settings.darkMode || false,
        documentFont: settings.documentFont || 'Lexend',
        eInvoicingEnabled: settings.eInvoicingEnabled || false,
        pdpProvider: settings.pdpProvider || null,
        pdpApiKey: settings.pdpApiKey ? '••••••••' : null,
        pdpSandbox: settings.pdpSandbox ?? true,
        defaultSubject: settings.defaultSubject || null,
        defaultAcceptanceConditions: settings.defaultAcceptanceConditions || null,
        defaultSignatureField: settings.defaultSignatureField || false,
        defaultFreeField: settings.defaultFreeField || null,
        defaultShowNotes: settings.defaultShowNotes ?? true,
        defaultVatExempt: settings.defaultVatExempt || false,
        defaultFooterText: settings.defaultFooterText || null,
        defaultShowDeliveryAddress: settings.defaultShowDeliveryAddress || false,
        defaultLanguage: settings.defaultLanguage || 'fr',
        quoteFilenamePattern: settings.quoteFilenamePattern || 'DEV-{numero}',
        invoiceFilenamePattern: settings.invoiceFilenamePattern || 'FAC-{numero}',
      },
    })
  }
}
