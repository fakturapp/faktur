import vine from '@vinejs/vine'

export const createPaymentLinkValidator = vine.compile(
  vine.object({
    paymentMethod: vine.enum(['bank_transfer']),
    paymentType: vine.enum(['full']),
    showIban: vine.boolean().optional(),
    password: vine.string().trim().minLength(4).maxLength(100).optional(),
    expirationType: vine.enum(['due_date', 'custom', 'days']).optional(),
    expiresAt: vine.string().trim().optional(),
    expirationDays: vine.number().min(1).max(365).optional(),
  })
)

export const confirmPaymentValidator = vine.compile(
  vine.object({
    notifyClient: vine.boolean(),
    paymentDate: vine.string().trim().optional(),
    notes: vine.string().trim().maxLength(500).optional(),
  })
)
