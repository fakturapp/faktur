import vine from '@vinejs/vine'

const lineFields = vine.object({
  description: vine.string().trim().minLength(1).maxLength(500),
  quantity: vine.number().min(0).max(1_000_000),
  unit: vine.string().trim().maxLength(50).nullable().optional(),
  sale_type: vine.string().trim().maxLength(50).nullable().optional(),
  unit_price_cents: vine.number().min(0).max(10_000_000_000),
  vat_rate: vine.number().min(0).max(100),
})

const baseFields = {
  client_id: vine.string().trim().maxLength(80),
  issue_date: vine.string().trim().maxLength(20),
  due_date: vine.string().trim().maxLength(20).nullable().optional(),
  language: vine.string().trim().maxLength(5).optional(),
  subject: vine.string().trim().maxLength(255).nullable().optional(),
  notes: vine.string().trim().nullable().optional(),
  payment_terms: vine.string().trim().maxLength(255).nullable().optional(),
  bank_account_id: vine.string().trim().maxLength(80).nullable().optional(),
  source_quote_id: vine.string().trim().maxLength(80).nullable().optional(),
  global_discount_type: vine.enum(['none', 'percentage', 'fixed'] as const).optional(),
  global_discount_value: vine.number().min(0).optional(),
  vat_exempt_reason: vine
    .enum(['none', 'not_subject', 'france_no_vat', 'outside_france'] as const)
    .optional(),
  vat_on_debits: vine.boolean().optional(),
  operation_category: vine
    .enum(['service', 'goods', 'mixed'] as const)
    .nullable()
    .optional(),
  delivery_address: vine.string().trim().nullable().optional(),
}

export const createInvoiceV2Validator = vine.compile(
  vine.object({
    ...baseFields,
    lines: vine.array(lineFields).minLength(1).maxLength(200),
  })
)

export const updateInvoiceV2Validator = vine.compile(
  vine.object({
    ...baseFields,
    client_id: vine.string().trim().maxLength(80).optional(),
    issue_date: vine.string().trim().maxLength(20).optional(),
    lines: vine.array(lineFields).maxLength(200).optional(),
  })
)

export const sendInvoiceV2Validator = vine.compile(
  vine.object({
    to: vine.array(vine.string().trim().email()).minLength(1).maxLength(10),
    cc: vine.array(vine.string().trim().email()).maxLength(10).optional(),
    bcc: vine.array(vine.string().trim().email()).maxLength(10).optional(),
    subject: vine.string().trim().maxLength(255).optional(),
    body: vine.string().trim().optional(),
    attach_pdf: vine.boolean().optional(),
  })
)
