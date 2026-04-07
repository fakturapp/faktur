import vine from '@vinejs/vine'

export const createProductValidator = vine.compile(
  vine.object({
    name: vine.string().trim().maxLength(255),
    description: vine.string().trim().maxLength(2000).optional(),
    unitPrice: vine.number().min(0),
    vatRate: vine.string().trim().maxLength(10).optional(),
    unit: vine.string().trim().maxLength(50).optional(),
    saleType: vine.string().trim().maxLength(30).optional(),
    reference: vine.string().trim().maxLength(100).optional(),
  })
)

export const updateProductValidator = vine.compile(
  vine.object({
    name: vine.string().trim().maxLength(255).optional(),
    description: vine.string().trim().maxLength(2000).optional().nullable(),
    unitPrice: vine.number().min(0).optional(),
    vatRate: vine.string().trim().maxLength(10).optional(),
    unit: vine.string().trim().maxLength(50).optional().nullable(),
    saleType: vine.string().trim().maxLength(30).optional().nullable(),
    reference: vine.string().trim().maxLength(100).optional().nullable(),
    isArchived: vine.boolean().optional(),
  })
)
