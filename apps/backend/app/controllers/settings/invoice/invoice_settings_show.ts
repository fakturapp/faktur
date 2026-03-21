import type { HttpContext } from '@adonisjs/core/http'
import InvoiceSetting from '#models/team/invoice_setting'
import Company from '#models/team/company'

export default class InvoiceSettingsShow {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const company = await Company.findBy('teamId', user.currentTeamId)
    const companyLogoUrl = company?.logoUrl || null

    let settings = await InvoiceSetting.findBy('teamId', user.currentTeamId)

    if (!settings) {
      // Return defaults if no settings exist yet
      return response.ok({
        companyLogoUrl,
        settings: {
          billingType: 'quick',
          accentColor: '#6366f1',
          logoUrl: null,
          logoSource: 'custom',
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
          footerMode: 'vat_exempt',
          logoBorderRadius: 0,
          aiEnabled: false,
          aiProvider: 'gemini',
          aiModel: 'gemini-2.5-flash-lite',
          aiCustomApiKey: null,
          aiApiKeyClaude: null,
          aiApiKeyGemini: null,
          aiApiKeyGroq: null,
        },
      })
    }

    return response.ok({
      companyLogoUrl,
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
        footerMode: settings.footerMode || 'vat_exempt',
        logoBorderRadius: settings.logoBorderRadius ?? 0,
        aiEnabled: settings.aiEnabled ?? false,
        aiProvider: settings.aiProvider || 'gemini',
        aiModel: settings.aiModel || 'gemini-2.5-flash-lite',
        aiCustomApiKey: settings.aiCustomApiKey ? '••••••••' : null,
        aiApiKeyClaude: settings.aiApiKeyClaude ? '••••••••' + settings.aiApiKeyClaude.slice(-4) : null,
        aiApiKeyGemini: settings.aiApiKeyGemini ? '••••••••' + settings.aiApiKeyGemini.slice(-4) : null,
        aiApiKeyGroq: settings.aiApiKeyGroq ? '••••••••' + settings.aiApiKeyGroq.slice(-4) : null,
      },
    })
  }
}
