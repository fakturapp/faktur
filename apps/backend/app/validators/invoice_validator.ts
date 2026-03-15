import vine from '@vinejs/vine'

export const createInvoiceValidator = vine.compile(
  vine.object({
    clientId: vine.string().trim().optional(),
    subject: vine.string().trim().maxLength(255).optional(),
    issueDate: vine.string().trim(),
    dueDate: vine.string().trim().optional(),
    billingType: vine.enum(['quick', 'detailed']),
    accentColor: vine.string().trim().regex(/^#[0-9a-fA-F]{6}$/),
    logoUrl: vine.string().trim().optional(),
    language: vine.enum(['fr', 'en']).optional(),
    notes: vine.string().trim().maxLength(2000).optional(),
    acceptanceConditions: vine.string().trim().maxLength(2000).optional(),
    signatureField: vine.boolean().optional(),
    documentTitle: vine.string().trim().maxLength(255).optional(),
    freeField: vine.string().trim().maxLength(2000).optional(),
    globalDiscountType: vine.enum(['none', 'percentage', 'fixed']).optional(),
    globalDiscountValue: vine.number().min(0).optional(),
    deliveryAddress: vine.string().trim().maxLength(500).optional(),
    clientSiren: vine.string().trim().maxLength(20).optional(),
    clientVatNumber: vine.string().trim().maxLength(30).optional(),
    sourceQuoteId: vine.string().trim().optional(),
    paymentTerms: vine.string().trim().maxLength(255).optional(),
    lines: vine.array(
      vine.object({
        description: vine.string().trim().maxLength(500),
        saleType: vine.string().trim().maxLength(50).optional(),
        quantity: vine.number().min(0),
        unit: vine.string().trim().maxLength(20).optional(),
        unitPrice: vine.number(),
        vatRate: vine.number().min(0).max(100),
      })
    ),
  })
)
