import vine from '@vinejs/vine'

const DOCUMENT_TYPES = ['invoice', 'quote', 'credit_note'] as const
const SHARE_PERMISSIONS = ['viewer', 'editor'] as const
const SHARE_VISIBILITIES = ['team', 'anyone'] as const

export const createShareValidator = vine.compile(
  vine.object({
    documentType: vine.enum(DOCUMENT_TYPES),
    documentId: vine.string().trim().uuid(),
    email: vine.string().trim().email(),
    permission: vine.enum(SHARE_PERMISSIONS),
  })
)

export const updateShareValidator = vine.compile(
  vine.object({
    permission: vine.enum(SHARE_PERMISSIONS),
  })
)

export const createShareLinkValidator = vine.compile(
  vine.object({
    documentType: vine.enum(DOCUMENT_TYPES),
    documentId: vine.string().trim().uuid(),
    permission: vine.enum(SHARE_PERMISSIONS),
    visibility: vine.enum(SHARE_VISIBILITIES).optional(),
    autoExpire: vine.boolean().optional(),
  })
)

export const updateShareLinkValidator = vine.compile(
  vine.object({
    permission: vine.enum(SHARE_PERMISSIONS).optional(),
    visibility: vine.enum(SHARE_VISIBILITIES).optional(),
    isActive: vine.boolean().optional(),
  })
)
