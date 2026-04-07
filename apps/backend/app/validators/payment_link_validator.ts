import vine from '@vinejs/vine'

export const createPaymentLinkValidator = vine.compile(
  vine.object({
    paymentMethod: vine.string().trim().maxLength(50),
    paymentType: vine.string().trim().maxLength(30),
    showIban: vine.boolean().optional(),
    password: vine.string().trim().minLength(4).maxLength(100).optional(),
    expirationType: vine.string().trim().maxLength(30).optional(),
    expiresAt: vine.string().trim().optional(),
    expirationDays: vine.number().min(1).max(365).optional(),
    includePdf: vine.boolean().optional(),
  })
)

export const confirmPaymentValidator = vine.compile(
  vine.object({
    notifyClient: vine.boolean(),
    paymentDate: vine.string().trim().optional(),
    notes: vine.string().trim().maxLength(500).optional(),
  })
)
