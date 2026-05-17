import vine from '@vinejs/vine'

export const listQuotesValidator = vine.compile(
  vine.object({
    limit: vine.number().min(1).max(200).optional(),
    cursor: vine.string().optional(),
    status: vine.string().trim().maxLength(200).optional(),
    client_id: vine.string().trim().maxLength(80).optional(),
    issue_date_after: vine.string().trim().maxLength(20).optional(),
    issue_date_before: vine.string().trim().maxLength(20).optional(),
    q: vine.string().trim().maxLength(200).optional(),
    sort: vine.enum(['created_at', '-created_at', 'issue_date', '-issue_date'] as const).optional(),
  })
)
