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
          darkMode: false,
          documentFont: 'Lexend',
          eInvoicingEnabled: false,
          pdpProvider: null,
          pdpApiKey: null,
          pdpSandbox: true,
          defaultSubject: null,
          defaultAcceptanceConditions: null,
          defaultSignatureField: false,
          defaultFreeField: null,
          defaultShowNotes: true,
          defaultVatExempt: false,
          defaultFooterText: null,
          defaultShowDeliveryAddress: false,
          defaultLanguage: 'fr',
          quoteFilenamePattern: 'DEV-{numero}',
          invoiceFilenamePattern: 'FAC-{numero}',
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
