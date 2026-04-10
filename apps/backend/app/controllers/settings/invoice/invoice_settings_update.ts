import type { HttpContext } from '@adonisjs/core/http'
import InvoiceSetting from '#models/team/invoice_setting'
import { updateInvoiceSettingsValidator } from '#validators/invoice_settings_validator'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'

export default class InvoiceSettingsUpdate {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const dek: Buffer = (ctx as any).dek

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const payload = await request.validateUsing(updateInvoiceSettingsValidator)

    // Normalize legacy values → 'company_info'
    if (payload.footerMode && !['custom', 'company_info'].includes(payload.footerMode)) {
      payload.footerMode = 'company_info'
    }

    let pdpApiKeyToStore: string | null = null
    if (payload.pdpApiKey && payload.pdpApiKey !== '••••••••') {
      pdpApiKeyToStore = zeroAccessCryptoService.encryptField(payload.pdpApiKey, dek)
    }

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
        pdpProvider: payload.pdpProvider ?? null,
        pdpApiKey: pdpApiKeyToStore,
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
        footerMode: payload.footerMode || 'company_info',
        logoBorderRadius: payload.logoBorderRadius ?? 0,
        collaborationEnabled: payload.collaborationEnabled ?? false,
        aiEnabled: payload.aiEnabled ?? false,
        aiProvider: 'gemini',
        aiModel: payload.aiModel || 'gemini-2.5-flash',
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
      if (payload.eInvoicingEnabled !== undefined)
        settings.eInvoicingEnabled = payload.eInvoicingEnabled
      if (payload.pdpProvider !== undefined)
        settings.pdpProvider = payload.pdpProvider ?? null
      if (payload.pdpApiKey && !payload.pdpApiKey.startsWith('••••••••')) {
        settings.pdpApiKey = pdpApiKeyToStore
      }
      if (payload.pdpSandbox !== undefined) settings.pdpSandbox = payload.pdpSandbox
      if (payload.defaultSubject !== undefined)
        settings.defaultSubject = payload.defaultSubject || null
      if (payload.defaultAcceptanceConditions !== undefined)
        settings.defaultAcceptanceConditions = payload.defaultAcceptanceConditions || null
      if (payload.defaultSignatureField !== undefined)
        settings.defaultSignatureField = payload.defaultSignatureField
      if (payload.defaultFreeField !== undefined)
        settings.defaultFreeField = payload.defaultFreeField || null
      if (payload.defaultShowNotes !== undefined)
        settings.defaultShowNotes = payload.defaultShowNotes
      if (payload.defaultVatExempt !== undefined)
        settings.defaultVatExempt = payload.defaultVatExempt
      if (payload.defaultFooterText !== undefined)
        settings.defaultFooterText = payload.defaultFooterText || null
      if (payload.defaultShowDeliveryAddress !== undefined)
        settings.defaultShowDeliveryAddress = payload.defaultShowDeliveryAddress
      if (payload.defaultLanguage !== undefined)
        settings.defaultLanguage = payload.defaultLanguage || 'fr'
      if (payload.quoteFilenamePattern !== undefined)
        settings.quoteFilenamePattern = payload.quoteFilenamePattern || 'DEV-{numero}'
      if (payload.invoiceFilenamePattern !== undefined)
        settings.invoiceFilenamePattern = payload.invoiceFilenamePattern || 'FAC-{numero}'
      if (payload.footerMode !== undefined) settings.footerMode = payload.footerMode || 'company_info'
      if (payload.logoBorderRadius !== undefined)
        settings.logoBorderRadius = payload.logoBorderRadius
      if (payload.collaborationEnabled !== undefined) settings.collaborationEnabled = payload.collaborationEnabled
      if (payload.aiEnabled !== undefined) settings.aiEnabled = payload.aiEnabled
      settings.aiProvider = 'gemini'
      if (payload.aiModel !== undefined)
        settings.aiModel = payload.aiModel || 'gemini-2.5-flash'
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
        footerMode: (['custom', 'company_info'].includes(settings.footerMode) ? settings.footerMode : 'company_info'),
        logoBorderRadius: settings.logoBorderRadius ?? 0,
        collaborationEnabled: settings.collaborationEnabled ?? false,
        aiEnabled: settings.aiEnabled ?? false,
        aiProvider: 'gemini',
        aiModel: settings.aiModel || 'gemini-2.5-flash',
      },
    })
  }
}
