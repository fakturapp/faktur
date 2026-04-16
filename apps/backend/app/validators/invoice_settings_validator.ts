import vine from '@vinejs/vine'

const looseBool = vine.any().optional().transform((v) => {
  if (v === undefined || v === null) return undefined
  if (v === true || v === 1 || v === '1' || v === 'true') return true
  if (v === false || v === 0 || v === '0' || v === 'false') return false
  return !!v
})

const BILLING_TYPES = ['quick', 'detailed'] as const
const LOGO_SOURCES = ['custom', 'company'] as const
const FOOTER_MODES = ['custom', 'company_info', 'vat_exempt'] as const
const PDP_PROVIDERS = ['b2brouter', 'sandbox'] as const

export const updateInvoiceSettingsValidator = vine.compile(
  vine.object({
    billingType: vine.enum(BILLING_TYPES),
    accentColor: vine
      .string()
      .trim()
      .regex(/^#[0-9a-fA-F]{6}$/),
    paymentMethods: vine.array(vine.string().trim().maxLength(50)),
    logoSource: vine.enum(LOGO_SOURCES).optional(),
    customPaymentMethod: vine.string().trim().maxLength(255).optional(),
    template: vine.string().trim().maxLength(30).optional(),
    darkMode: looseBool.clone(),
    documentFont: vine.string().trim().maxLength(50).optional(),
    eInvoicingEnabled: looseBool.clone(),
    pdpProvider: vine.enum(PDP_PROVIDERS).optional().nullable(),
    pdpApiKey: vine.string().trim().maxLength(500).optional().nullable(),
    pdpSandbox: looseBool.clone(),
    logoUrl: vine.string().trim().maxLength(500).optional().nullable(),
    defaultOperationCategory: vine
      .enum(['service', 'goods', 'mixed'] as const)
      .optional()
      .nullable(),
    defaultSubject: vine.string().trim().maxLength(500).optional().nullable(),
    defaultAcceptanceConditions: vine.string().trim().maxLength(2000).optional().nullable(),
    defaultSignatureField: looseBool.clone(),
    defaultFreeField: vine.string().trim().maxLength(2000).optional().nullable(),
    defaultShowNotes: looseBool.clone(),
    defaultVatExempt: looseBool.clone(),
    defaultFooterText: vine.string().trim().maxLength(1000).optional().nullable(),
    defaultShowDeliveryAddress: looseBool.clone(),
    defaultLanguage: vine.string().trim().maxLength(5).optional(),
    quoteFilenamePattern: vine.string().trim().maxLength(255).optional(),
    invoiceFilenamePattern: vine.string().trim().maxLength(255).optional(),
    footerMode: vine.enum(FOOTER_MODES).optional(),
    logoBorderRadius: vine.number().min(0).max(50).optional(),
    collaborationEnabled: looseBool.clone(),
    aiEnabled: looseBool.clone(),
    aiProvider: vine.string().trim().maxLength(30).optional(),
    aiModel: vine.string().trim().maxLength(100).optional(),
    b2bAccountId: vine.string().trim().maxLength(100).optional().nullable(),
    b2bEnterpriseSize: vine.string().trim().maxLength(10).optional().nullable(),
    b2bNafCode: vine.string().trim().maxLength(10).optional().nullable(),
    b2bTypeOperation: vine.string().trim().maxLength(20).optional().nullable(),
    b2bEreportingEnabled: looseBool.clone(),
  })
)
