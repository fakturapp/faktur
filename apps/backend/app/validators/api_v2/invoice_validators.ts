import vine from '@vinejs/vine'

export const listInvoicesValidator = vine.compile(
  vine.object({
    limit: vine.number().min(1).max(200).optional(),
    cursor: vine.string().optional(),
    status: vine.string().trim().maxLength(200).optional(),
    client_id: vine.string().trim().maxLength(80).optional(),
    issue_date_after: vine.string().trim().maxLength(20).optional(),
    issue_date_before: vine.string().trim().maxLength(20).optional(),
    due_date_after: vine.string().trim().maxLength(20).optional(),
    due_date_before: vine.string().trim().maxLength(20).optional(),
    q: vine.string().trim().maxLength(200).optional(),
    sort: vine.enum(['created_at', '-created_at', 'issue_date', '-issue_date'] as const).optional(),
  })
)

export const markPaidValidator = vine.compile(
  vine.object({
    amount_cents: vine.number().min(0).optional(),
    paid_at: vine.string().trim().maxLength(40).optional(),
    payment_method: vine.string().trim().maxLength(60).optional(),
    reference: vine.string().trim().maxLength(200).optional(),
  })
)
