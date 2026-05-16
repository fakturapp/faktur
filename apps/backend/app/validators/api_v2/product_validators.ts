import vine from '@vinejs/vine'

const productFields = {
  name: vine.string().trim().minLength(1).maxLength(255),
  description: vine.string().trim().nullable().optional(),
  unit_price_cents: vine.number().min(0).max(10_000_000_000),
  vat_rate: vine.string().trim().maxLength(10).optional(),
  unit: vine.string().trim().maxLength(50).nullable().optional(),
  sale_type: vine.string().trim().maxLength(50).nullable().optional(),
  reference: vine.string().trim().maxLength(100).nullable().optional(),
  is_archived: vine.boolean().optional(),
}

export const createProductValidator = vine.compile(vine.object(productFields))

export const updateProductValidator = vine.compile(
  vine.object({
    ...productFields,
    name: vine.string().trim().minLength(1).maxLength(255).optional(),
    unit_price_cents: vine.number().min(0).max(10_000_000_000).optional(),
  })
)

export const listProductsValidator = vine.compile(
  vine.object({
    limit: vine.number().min(1).max(200).optional(),
    cursor: vine.string().optional(),
    q: vine.string().trim().maxLength(200).optional(),
    archived: vine.boolean().optional(),
    sort: vine.enum(['created_at', '-created_at', 'name', '-name'] as const).optional(),
  })
)
