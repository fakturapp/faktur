import vine from '@vinejs/vine'

export const createTeamValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(100),
    iconUrl: vine.string().trim().maxLength(500).optional(),
  })
)

export const createCompanyValidator = vine.compile(
  vine.object({
    legalName: vine.string().trim().minLength(1).maxLength(255),
    tradeName: vine.string().trim().maxLength(255).optional(),
    siren: vine.string().trim().maxLength(9).optional(),
    siret: vine.string().trim().maxLength(14).optional(),
    vatNumber: vine.string().trim().maxLength(20).optional(),
    legalForm: vine.string().trim().maxLength(100).optional(),
    addressLine1: vine.string().trim().maxLength(255).optional(),
    addressLine2: vine.string().trim().maxLength(255).optional(),
    city: vine.string().trim().maxLength(100).optional(),
    postalCode: vine.string().trim().maxLength(10).optional(),
    country: vine.string().trim().maxLength(2).optional(),
    phone: vine.string().trim().maxLength(20).optional(),
    email: vine.string().trim().email().optional(),
    website: vine.string().trim().maxLength(255).optional(),
    iban: vine.string().trim().maxLength(34).optional(),
    bic: vine.string().trim().maxLength(11).optional(),
    bankName: vine.string().trim().maxLength(100).optional(),
    paymentConditions: vine.string().trim().maxLength(500).optional(),
    currency: vine.string().trim().maxLength(3).optional(),
  })
)

export const updateCompanyValidator = vine.compile(
  vine.object({
    legalName: vine.string().trim().minLength(1).maxLength(255).optional(),
    tradeName: vine.string().trim().maxLength(255).optional(),
    siren: vine.string().trim().maxLength(9).optional(),
    siret: vine.string().trim().maxLength(14).optional(),
    vatNumber: vine.string().trim().maxLength(20).optional(),
    legalForm: vine.string().trim().maxLength(100).optional(),
    addressLine1: vine.string().trim().maxLength(255).optional(),
    addressLine2: vine.string().trim().maxLength(255).optional(),
    city: vine.string().trim().maxLength(100).optional(),
    postalCode: vine.string().trim().maxLength(10).optional(),
    country: vine.string().trim().maxLength(2).optional(),
    phone: vine.string().trim().maxLength(20).optional(),
    email: vine.string().trim().email().optional(),
    website: vine.string().trim().maxLength(255).optional(),
    logoUrl: vine.string().trim().maxLength(500).nullable().optional(),
    iban: vine.string().trim().maxLength(34).optional(),
    bic: vine.string().trim().maxLength(11).optional(),
    bankName: vine.string().trim().maxLength(100).optional(),
    paymentConditions: vine.string().trim().maxLength(500).optional(),
    currency: vine.string().trim().maxLength(3).optional(),
  })
)

export const updateBankValidator = vine.compile(
  vine.object({
    iban: vine.string().trim().maxLength(34).optional(),
    bic: vine.string().trim().maxLength(11).optional(),
    bankName: vine.string().trim().maxLength(100).optional(),
  })
)
