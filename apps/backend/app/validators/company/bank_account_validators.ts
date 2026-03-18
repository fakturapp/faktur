import vine from '@vinejs/vine'

export const createBankAccountValidator = vine.compile(
  vine.object({
    label: vine.string().trim().minLength(1).maxLength(255),
    bankName: vine.string().trim().maxLength(255).optional(),
    iban: vine.string().trim().maxLength(34).optional(),
    bic: vine.string().trim().maxLength(11).optional(),
    isDefault: vine.boolean().optional(),
  })
)

export const updateBankAccountValidator = createBankAccountValidator
