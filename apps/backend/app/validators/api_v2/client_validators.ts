import vine from '@vinejs/vine'

const baseClientFields = {
  type: vine.enum(['company', 'individual'] as const).optional(),
  civility: vine
    .enum(['mr', 'mme'] as const)
    .nullable()
    .optional(),
  company_name: vine.string().trim().maxLength(255).nullable().optional(),
  first_name: vine.string().trim().maxLength(100).nullable().optional(),
  last_name: vine.string().trim().maxLength(100).nullable().optional(),
  email: vine.string().trim().email().nullable().optional(),
  phone: vine.string().trim().maxLength(40).nullable().optional(),
  siren: vine.string().trim().maxLength(9).nullable().optional(),
  siret: vine.string().trim().maxLength(14).nullable().optional(),
  vat_number: vine.string().trim().maxLength(40).nullable().optional(),
  address: vine.string().trim().maxLength(255).nullable().optional(),
  address_complement: vine.string().trim().maxLength(255).nullable().optional(),
  postal_code: vine.string().trim().maxLength(20).nullable().optional(),
  city: vine.string().trim().maxLength(100).nullable().optional(),
  country: vine.string().trim().maxLength(2).optional(),
  include_in_emails: vine.boolean().optional(),
  notes: vine.string().trim().nullable().optional(),
}

export const createClientValidator = vine.compile(vine.object(baseClientFields))

export const updateClientValidator = vine.compile(vine.object(baseClientFields))

export const listClientsValidator = vine.compile(
  vine.object({
    limit: vine.number().min(1).max(200).optional(),
    cursor: vine.string().optional(),
    q: vine.string().trim().maxLength(200).optional(),
    email: vine.string().trim().maxLength(255).optional(),
    siren: vine.string().trim().maxLength(9).optional(),
    type: vine.enum(['company', 'individual'] as const).optional(),
    sort: vine.enum(['created_at', '-created_at', 'name', '-name'] as const).optional(),
  })
)
