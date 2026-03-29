import vine from '@vinejs/vine'

export const createQuoteValidator = vine.compile(
  vine.object({
    clientId: vine.string().trim().optional(),
    subject: vine.string().trim().maxLength(255).optional(),
    issueDate: vine.string().trim(),
    validityDate: vine.string().trim().optional(),
    billingType: vine.enum(['quick', 'detailed']),
    accentColor: vine
      .string()
      .trim()
      .regex(/^#[0-9a-fA-F]{6}$/),
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
    clientSnapshot: vine
      .object({
        type: vine.enum(['company', 'individual']).optional(),
        displayName: vine.string().trim().maxLength(255).optional(),
        companyName: vine.string().trim().maxLength(255).optional().nullable(),
        firstName: vine.string().trim().maxLength(100).optional().nullable(),
        lastName: vine.string().trim().maxLength(100).optional().nullable(),
        email: vine.string().trim().maxLength(255).optional().nullable(),
        phone: vine.string().trim().maxLength(30).optional().nullable(),
        address: vine.string().trim().maxLength(500).optional().nullable(),
        addressComplement: vine.string().trim().maxLength(500).optional().nullable(),
        postalCode: vine.string().trim().maxLength(20).optional().nullable(),
        city: vine.string().trim().maxLength(100).optional().nullable(),
        country: vine.string().trim().maxLength(100).optional(),
        siren: vine.string().trim().maxLength(20).optional().nullable(),
        vatNumber: vine.string().trim().maxLength(30).optional().nullable(),
      })
      .optional(),
    companySnapshot: vine
      .object({
        legalName: vine.string().trim().maxLength(255).optional().nullable(),
        tradeName: vine.string().trim().maxLength(255).optional().nullable(),
        siren: vine.string().trim().maxLength(20).optional().nullable(),
        siret: vine.string().trim().maxLength(20).optional().nullable(),
        vatNumber: vine.string().trim().maxLength(30).optional().nullable(),
        legalForm: vine.string().trim().maxLength(100).optional().nullable(),
        addressLine1: vine.string().trim().maxLength(500).optional().nullable(),
        addressLine2: vine.string().trim().maxLength(500).optional().nullable(),
        city: vine.string().trim().maxLength(100).optional().nullable(),
        postalCode: vine.string().trim().maxLength(20).optional().nullable(),
        country: vine.string().trim().maxLength(100).optional().nullable(),
        phone: vine.string().trim().maxLength(30).optional().nullable(),
        email: vine.string().trim().maxLength(255).optional().nullable(),
        website: vine.string().trim().maxLength(255).optional().nullable(),
      })
      .optional(),
    vatExemptReason: vine
      .enum(['none', 'not_subject', 'france_no_vat', 'outside_france'])
      .optional(),
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
