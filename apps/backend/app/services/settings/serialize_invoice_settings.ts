type InvoiceSettingsSource = {
  billingType?: 'quick' | 'detailed' | null
  accentColor?: string | null
  logoUrl?: string | null
  logoSource?: string | null
  paymentMethods?: string[] | null
  customPaymentMethod?: string | null
  template?: string | null
  darkMode?: boolean | null
  documentFont?: string | null
  eInvoicingEnabled?: boolean | null
  pdpProvider?: string | null
  pdpApiKey?: string | null
  pdpSandbox?: boolean | null
  defaultOperationCategory?: 'service' | 'goods' | 'mixed' | null
  defaultSubject?: string | null
  defaultAcceptanceConditions?: string | null
  defaultSignatureField?: boolean | null
  defaultFreeField?: string | null
  defaultShowNotes?: boolean | null
  defaultVatExempt?: boolean | null
  defaultVatRate?: number | null
  defaultShowQuantityColumn?: boolean | null
  defaultShowUnitColumn?: boolean | null
  defaultShowUnitPriceColumn?: boolean | null
  defaultShowVatColumn?: boolean | null
  defaultFooterText?: string | null
  defaultShowDeliveryAddress?: boolean | null
  defaultLanguage?: string | null
  quoteFilenamePattern?: string | null
  invoiceFilenamePattern?: string | null
  quoteNumberPattern?: string | null
  invoiceNumberPattern?: string | null
  footerMode?: string | null
  logoBorderRadius?: number | null
  collaborationEnabled?: boolean | null
  aiEnabled?: boolean | null
  aiModel?: string | null
}

export function serializeInvoiceSettings(settings: InvoiceSettingsSource) {
  return {
    billingType: settings.billingType || 'quick',
    accentColor: settings.accentColor || '#6366f1',
    logoUrl: settings.logoUrl || null,
    logoSource: settings.logoSource === 'company' ? 'company' : 'custom',
    paymentMethods: settings.paymentMethods?.length ? settings.paymentMethods : ['bank_transfer'],
    customPaymentMethod: settings.customPaymentMethod || '',
    template: settings.template || 'classique',
    darkMode: settings.darkMode || false,
    documentFont: settings.documentFont || 'Lexend',
    eInvoicingEnabled: settings.eInvoicingEnabled || false,
    pdpProvider: settings.pdpProvider || null,
    pdpApiKey: settings.pdpApiKey ? '••••••••' : null,
    pdpSandbox: settings.pdpSandbox ?? true,
    defaultOperationCategory: settings.defaultOperationCategory || 'service',
    defaultSubject: settings.defaultSubject || null,
    defaultAcceptanceConditions: settings.defaultAcceptanceConditions || null,
    defaultSignatureField: settings.defaultSignatureField || false,
    defaultFreeField: settings.defaultFreeField || null,
    defaultShowNotes: settings.defaultShowNotes ?? true,
    defaultVatExempt: settings.defaultVatExempt || false,
    defaultVatRate: settings.defaultVatRate ?? 20,
    defaultShowQuantityColumn: settings.defaultShowQuantityColumn ?? true,
    defaultShowUnitColumn: settings.defaultShowUnitColumn ?? true,
    defaultShowUnitPriceColumn: settings.defaultShowUnitPriceColumn ?? true,
    defaultShowVatColumn: settings.defaultShowVatColumn ?? true,
    defaultFooterText: settings.defaultFooterText || null,
    defaultShowDeliveryAddress: settings.defaultShowDeliveryAddress || false,
    defaultLanguage: settings.defaultLanguage || 'fr',
    quoteFilenamePattern: settings.quoteFilenamePattern || 'DEV-{numero}',
    invoiceFilenamePattern: settings.invoiceFilenamePattern || 'FAC-{numero}',
    quoteNumberPattern:
      settings.quoteNumberPattern || settings.quoteFilenamePattern || 'DEV-{numero}',
    invoiceNumberPattern:
      settings.invoiceNumberPattern || settings.invoiceFilenamePattern || 'FAC-{numero}',
    footerMode: ['custom', 'company_info'].includes(settings.footerMode || '')
      ? settings.footerMode
      : 'company_info',
    logoBorderRadius: settings.logoBorderRadius ?? 0,
    collaborationEnabled: settings.collaborationEnabled ?? false,
    aiEnabled: settings.aiEnabled ?? false,
    aiProvider: 'gemini' as const,
    aiModel: settings.aiModel || 'nvidia/nemotron-3-super-120b-a12b:free',
  }
}
