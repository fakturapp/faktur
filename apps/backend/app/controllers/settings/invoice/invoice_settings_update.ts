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

    // Encrypt pdpApiKey if provided
    let pdpApiKeyToStore: string | null = null
    if (payload.pdpApiKey && payload.pdpApiKey !== '••••••••') {
      pdpApiKeyToStore = zeroAccessCryptoService.encryptField(payload.pdpApiKey, dek)
    }

    // Encrypt aiCustomApiKey if provided
    let aiCustomApiKeyToStore: string | null = null
    if (payload.aiCustomApiKey && payload.aiCustomApiKey !== '••••••••') {
      aiCustomApiKeyToStore = zeroAccessCryptoService.encryptField(payload.aiCustomApiKey, dek)
    }

    // Encrypt per-provider keys if provided
    let aiApiKeyClaudeToStore: string | null = null
    if (payload.aiApiKeyClaude && !payload.aiApiKeyClaude.startsWith('••••••••')) {
      aiApiKeyClaudeToStore = zeroAccessCryptoService.encryptField(payload.aiApiKeyClaude, dek)
    }
    let aiApiKeyGeminiToStore: string | null = null
    if (payload.aiApiKeyGemini && !payload.aiApiKeyGemini.startsWith('••••••••')) {
      aiApiKeyGeminiToStore = zeroAccessCryptoService.encryptField(payload.aiApiKeyGemini, dek)
    }
    let aiApiKeyGroqToStore: string | null = null
    if (payload.aiApiKeyGroq && !payload.aiApiKeyGroq.startsWith('••••••••')) {
      aiApiKeyGroqToStore = zeroAccessCryptoService.encryptField(payload.aiApiKeyGroq, dek)
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
        pdpProvider: (payload.pdpProvider || null) as 'b2brouter' | 'sandbox' | null,
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
        footerMode: payload.footerMode || 'vat_exempt',
        logoBorderRadius: payload.logoBorderRadius ?? 0,
        aiKeyMode: payload.aiKeyMode || 'server',
        aiEnabled: payload.aiEnabled ?? false,
        aiProvider: payload.aiProvider || 'gemini',
        aiModel: payload.aiModel || 'gemini-2.5-flash-lite',
        aiCustomApiKey: aiCustomApiKeyToStore,
        aiApiKeyClaude: aiApiKeyClaudeToStore,
        aiApiKeyGemini: aiApiKeyGeminiToStore,
        aiApiKeyGroq: aiApiKeyGroqToStore,
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
      if (payload.pdpProvider !== undefined) settings.pdpProvider = (payload.pdpProvider || null) as 'b2brouter' | 'sandbox' | null
      if (payload.pdpApiKey !== undefined && payload.pdpApiKey !== '••••••••') {
        settings.pdpApiKey = pdpApiKeyToStore
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
      if (payload.footerMode !== undefined) settings.footerMode = payload.footerMode || 'vat_exempt'
      if (payload.logoBorderRadius !== undefined) settings.logoBorderRadius = payload.logoBorderRadius
      if (payload.aiKeyMode !== undefined) settings.aiKeyMode = payload.aiKeyMode || 'server'
      if (payload.aiEnabled !== undefined) settings.aiEnabled = payload.aiEnabled
      if (payload.aiProvider !== undefined) settings.aiProvider = payload.aiProvider || 'gemini'
      if (payload.aiModel !== undefined) settings.aiModel = payload.aiModel || 'gemini-2.5-flash-lite'
      if (payload.aiCustomApiKey !== undefined && payload.aiCustomApiKey !== '••••••••') {
        settings.aiCustomApiKey = aiCustomApiKeyToStore
      }
      if (payload.aiApiKeyClaude !== undefined && !payload.aiApiKeyClaude?.startsWith('••••••••')) {
        settings.aiApiKeyClaude = aiApiKeyClaudeToStore
      }
      if (payload.aiApiKeyGemini !== undefined && !payload.aiApiKeyGemini?.startsWith('••••••••')) {
        settings.aiApiKeyGemini = aiApiKeyGeminiToStore
      }
      if (payload.aiApiKeyGroq !== undefined && !payload.aiApiKeyGroq?.startsWith('••••••••')) {
        settings.aiApiKeyGroq = aiApiKeyGroqToStore
      }
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
        footerMode: settings.footerMode || 'vat_exempt',
        logoBorderRadius: settings.logoBorderRadius ?? 0,
        aiKeyMode: settings.aiKeyMode || 'server',
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
