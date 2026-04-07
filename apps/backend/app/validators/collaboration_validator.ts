import vine from '@vinejs/vine'

export const createShareValidator = vine.compile(
  vine.object({
    documentType: vine.string().trim().maxLength(30),
    documentId: vine.string().trim().uuid(),
    email: vine.string().trim().email(),
    permission: vine.string().trim().maxLength(20),
  })
)

export const updateShareValidator = vine.compile(
  vine.object({
    permission: vine.string().trim().maxLength(20),
  })
)

export const createShareLinkValidator = vine.compile(
  vine.object({
    documentType: vine.string().trim().maxLength(30),
    documentId: vine.string().trim().uuid(),
    permission: vine.string().trim().maxLength(20),
    visibility: vine.string().trim().maxLength(20).optional(),
    autoExpire: vine.boolean().optional(),
  })
)

export const updateShareLinkValidator = vine.compile(
  vine.object({
    permission: vine.string().trim().maxLength(20).optional(),
    visibility: vine.string().trim().maxLength(20).optional(),
    isActive: vine.boolean().optional(),
  })
)
