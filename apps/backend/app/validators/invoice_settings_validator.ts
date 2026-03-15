import vine from '@vinejs/vine'

export const updateInvoiceSettingsValidator = vine.compile(
  vine.object({
    billingType: vine.enum(['quick', 'detailed']),
    accentColor: vine.string().trim().regex(/^#[0-9a-fA-F]{6}$/),
    paymentMethods: vine.array(vine.enum(['bank_transfer', 'cash', 'custom'])),
    logoSource: vine.enum(['custom', 'company']).optional(),
    customPaymentMethod: vine.string().trim().maxLength(255).optional(),
    template: vine.string().trim().maxLength(30).optional(),
    darkMode: vine.boolean().optional(),
    documentFont: vine.string().trim().maxLength(50).optional(),
    eInvoicingEnabled: vine.boolean().optional(),
    pdpProvider: vine.string().trim().maxLength(50).optional().nullable(),
    pdpApiKey: vine.string().trim().maxLength(500).optional().nullable(),
    pdpSandbox: vine.boolean().optional(),
    defaultSubject: vine.string().trim().maxLength(500).optional().nullable(),
    defaultAcceptanceConditions: vine.string().trim().maxLength(2000).optional().nullable(),
    defaultSignatureField: vine.boolean().optional(),
    defaultFreeField: vine.string().trim().maxLength(2000).optional().nullable(),
    defaultShowNotes: vine.boolean().optional(),
    defaultVatExempt: vine.boolean().optional(),
    defaultFooterText: vine.string().trim().maxLength(50).optional().nullable(),
    defaultShowDeliveryAddress: vine.boolean().optional(),
    defaultLanguage: vine.string().trim().maxLength(5).optional(),
    quoteFilenamePattern: vine.string().trim().maxLength(255).optional(),
    invoiceFilenamePattern: vine.string().trim().maxLength(255).optional(),
    footerMode: vine.enum(['company_info', 'vat_exempt', 'custom']).optional(),
  })
)
