import vine from '@vinejs/vine'

const baseFields = {
  description: vine.string().trim().minLength(1).maxLength(500),
  supplier: vine.string().trim().maxLength(255).nullable().optional(),
  category_id: vine.string().trim().maxLength(80).nullable().optional(),
  amount_cents: vine.number().min(0).max(10_000_000_000),
  vat_amount_cents: vine.number().min(0).max(10_000_000_000).optional(),
  vat_rate: vine.number().min(0).max(100).optional(),
  currency: vine.string().trim().maxLength(3).optional(),
  expense_date: vine.string().trim().maxLength(20),
  payment_method: vine.string().trim().maxLength(60).nullable().optional(),
  is_deductible: vine.boolean().optional(),
  notes: vine.string().trim().nullable().optional(),
}

export const createExpenseValidator = vine.compile(vine.object(baseFields))
export const updateExpenseValidator = vine.compile(
  vine.object({
    ...baseFields,
    description: vine.string().trim().minLength(1).maxLength(500).optional(),
    amount_cents: vine.number().min(0).max(10_000_000_000).optional(),
    expense_date: vine.string().trim().maxLength(20).optional(),
  })
)

export const listExpensesValidator = vine.compile(
  vine.object({
    limit: vine.number().min(1).max(200).optional(),
    cursor: vine.string().optional(),
    date_after: vine.string().trim().maxLength(20).optional(),
    date_before: vine.string().trim().maxLength(20).optional(),
    deductible_only: vine.boolean().optional(),
    sort: vine.enum(['created_at', '-created_at', 'expense_date', '-expense_date'] as const).optional(),
  })
)
