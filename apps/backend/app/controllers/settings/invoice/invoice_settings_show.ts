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
          footerMode: 'company_info',
          logoBorderRadius: 0,
          collaborationEnabled: false,
          aiEnabled: false,
          aiProvider: 'gemini',
          aiModel: 'nvidia/nemotron-3-super-120b-a12b:free',
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
        footerMode: (['custom', 'company_info'].includes(settings.footerMode) ? settings.footerMode : 'company_info'),
        logoBorderRadius: settings.logoBorderRadius ?? 0,
        collaborationEnabled: settings.collaborationEnabled ?? false,
        aiEnabled: settings.aiEnabled ?? false,
        aiProvider: 'gemini',
        aiModel: settings.aiModel || 'nvidia/nemotron-3-super-120b-a12b:free',
      },
    })
  }
}
