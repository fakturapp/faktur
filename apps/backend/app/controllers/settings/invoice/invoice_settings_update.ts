import type { HttpContext } from '@adonisjs/core/http'
import InvoiceSetting from '#models/team/invoice_setting'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import { buildDefaultInvoiceSettings } from '#services/settings/default_invoice_settings'
import { serializeInvoiceSettings } from '#services/settings/serialize_invoice_settings'
import { updateInvoiceSettingsValidator } from '#validators/invoice_settings_validator'

export default class InvoiceSettingsUpdate {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const dek: Buffer = (ctx as any).dek

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const payload = await request.validateUsing(updateInvoiceSettingsValidator)

    if (payload.footerMode && !['custom', 'company_info'].includes(payload.footerMode)) {
      payload.footerMode = 'company_info'
    }

    let pdpApiKeyToStore: string | null = null
    if (payload.pdpApiKey && payload.pdpApiKey !== '••••••••') {
      pdpApiKeyToStore = zeroAccessCryptoService.encryptField(payload.pdpApiKey, dek)
    }

    let settings = await InvoiceSetting.findBy('teamId', user.currentTeamId)

    if (!settings) {
      const defaultSettings = buildDefaultInvoiceSettings(user.currentTeamId)
      settings = await InvoiceSetting.create({
        ...defaultSettings,
        billingType: payload.billingType,
        accentColor: payload.accentColor,
        paymentMethods: payload.paymentMethods,
        logoSource: payload.logoSource || defaultSettings.logoSource,
        customPaymentMethod: payload.customPaymentMethod || null,
        template: payload.template || defaultSettings.template,
        darkMode: payload.darkMode ?? defaultSettings.darkMode,
        documentFont: payload.documentFont || defaultSettings.documentFont,
        eInvoicingEnabled: payload.eInvoicingEnabled ?? defaultSettings.eInvoicingEnabled,
        pdpProvider: payload.pdpProvider ?? defaultSettings.pdpProvider,
        pdpApiKey: pdpApiKeyToStore,
        pdpSandbox: payload.pdpSandbox ?? defaultSettings.pdpSandbox,
        defaultOperationCategory: payload.defaultOperationCategory ?? defaultSettings.defaultOperationCategory,
        defaultSubject: payload.defaultSubject || null,
        defaultAcceptanceConditions: payload.defaultAcceptanceConditions || null,
        defaultSignatureField: payload.defaultSignatureField ?? defaultSettings.defaultSignatureField,
        defaultFreeField: payload.defaultFreeField || null,
        defaultShowNotes: payload.defaultShowNotes ?? defaultSettings.defaultShowNotes,
        defaultVatExempt: payload.defaultVatExempt ?? defaultSettings.defaultVatExempt,
        defaultVatRate: payload.defaultVatRate ?? defaultSettings.defaultVatRate,
        defaultShowQuantityColumn: payload.defaultShowQuantityColumn ?? defaultSettings.defaultShowQuantityColumn,
        defaultShowUnitColumn: payload.defaultShowUnitColumn ?? defaultSettings.defaultShowUnitColumn,
        defaultShowUnitPriceColumn: payload.defaultShowUnitPriceColumn ?? defaultSettings.defaultShowUnitPriceColumn,
        defaultShowVatColumn: payload.defaultShowVatColumn ?? defaultSettings.defaultShowVatColumn,
        defaultFooterText: payload.defaultFooterText || null,
        defaultShowDeliveryAddress: payload.defaultShowDeliveryAddress ?? defaultSettings.defaultShowDeliveryAddress,
        defaultLanguage: payload.defaultLanguage || defaultSettings.defaultLanguage,
        quoteFilenamePattern: payload.quoteFilenamePattern || defaultSettings.quoteFilenamePattern,
        invoiceFilenamePattern: payload.invoiceFilenamePattern || defaultSettings.invoiceFilenamePattern,
        footerMode: payload.footerMode || defaultSettings.footerMode,
        logoBorderRadius: payload.logoBorderRadius ?? defaultSettings.logoBorderRadius,
        collaborationEnabled: payload.collaborationEnabled ?? defaultSettings.collaborationEnabled,
        aiEnabled: payload.aiEnabled ?? defaultSettings.aiEnabled,
        aiProvider: defaultSettings.aiProvider,
        aiModel: payload.aiModel || defaultSettings.aiModel,
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
      if (payload.pdpProvider !== undefined) settings.pdpProvider = payload.pdpProvider ?? null
      if (payload.pdpApiKey && !payload.pdpApiKey.startsWith('••••••••')) {
        settings.pdpApiKey = pdpApiKeyToStore
      }
      if (payload.pdpSandbox !== undefined) settings.pdpSandbox = payload.pdpSandbox
      if (payload.defaultOperationCategory !== undefined) {
        settings.defaultOperationCategory = payload.defaultOperationCategory
      }
      if (payload.defaultSubject !== undefined) settings.defaultSubject = payload.defaultSubject || null
      if (payload.defaultAcceptanceConditions !== undefined) {
        settings.defaultAcceptanceConditions = payload.defaultAcceptanceConditions || null
      }
      if (payload.defaultSignatureField !== undefined) settings.defaultSignatureField = payload.defaultSignatureField
      if (payload.defaultFreeField !== undefined) settings.defaultFreeField = payload.defaultFreeField || null
      if (payload.defaultShowNotes !== undefined) settings.defaultShowNotes = payload.defaultShowNotes
      if (payload.defaultVatExempt !== undefined) settings.defaultVatExempt = payload.defaultVatExempt
      if (payload.defaultVatRate !== undefined) settings.defaultVatRate = payload.defaultVatRate
      if (payload.defaultShowQuantityColumn !== undefined) {
        settings.defaultShowQuantityColumn = payload.defaultShowQuantityColumn
      }
      if (payload.defaultShowUnitColumn !== undefined) settings.defaultShowUnitColumn = payload.defaultShowUnitColumn
      if (payload.defaultShowUnitPriceColumn !== undefined) {
        settings.defaultShowUnitPriceColumn = payload.defaultShowUnitPriceColumn
      }
      if (payload.defaultShowVatColumn !== undefined) settings.defaultShowVatColumn = payload.defaultShowVatColumn
      if (payload.defaultFooterText !== undefined) settings.defaultFooterText = payload.defaultFooterText || null
      if (payload.defaultShowDeliveryAddress !== undefined) {
        settings.defaultShowDeliveryAddress = payload.defaultShowDeliveryAddress
      }
      if (payload.defaultLanguage !== undefined) settings.defaultLanguage = payload.defaultLanguage || 'fr'
      if (payload.quoteFilenamePattern !== undefined) {
        settings.quoteFilenamePattern = payload.quoteFilenamePattern || 'DEV-{numero}'
      }
      if (payload.invoiceFilenamePattern !== undefined) {
        settings.invoiceFilenamePattern = payload.invoiceFilenamePattern || 'FAC-{numero}'
      }
      if (payload.footerMode !== undefined) settings.footerMode = payload.footerMode || 'company_info'
      if (payload.logoBorderRadius !== undefined) settings.logoBorderRadius = payload.logoBorderRadius
      if (payload.collaborationEnabled !== undefined) settings.collaborationEnabled = payload.collaborationEnabled
      if (payload.aiEnabled !== undefined) settings.aiEnabled = payload.aiEnabled
      settings.aiProvider = 'gemini'
      if (payload.aiModel !== undefined) {
        settings.aiModel = payload.aiModel || 'nvidia/nemotron-3-super-120b-a12b:free'
      }
      await settings.save()
    }

    return response.ok({
      message: 'Invoice settings updated',
      settings: serializeInvoiceSettings(settings),
    })
  }
}
