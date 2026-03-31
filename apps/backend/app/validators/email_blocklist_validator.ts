import vine from '@vinejs/vine'

/** POST /auth/check-email */
export const checkEmailValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail(),
  })
)

/** POST /auth/email-appeal */
export const emailAppealValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail(),
    reason: vine.string().trim().minLength(10).maxLength(1000),
  })
)

/** Admin: add domain to blocklist */
export const addDomainValidator = vine.compile(
  vine.object({
    domain: vine.string().trim().minLength(3).maxLength(255),
    reason: vine.string().trim().maxLength(500).optional(),
  })
)

/** Admin: review appeal */
export const reviewAppealValidator = vine.compile(
  vine.object({
    status: vine.enum(['approved', 'rejected']),
    adminNote: vine.string().trim().maxLength(500).optional(),
  })
)
