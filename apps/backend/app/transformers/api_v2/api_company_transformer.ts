import type Company from '#models/team/company'
import publicIdCodec from '#services/api/public_id_codec'

export interface ApiCompanyShape {
  id: string
  legal_name: string
  trade_name: string | null
  siren: string | null
  siret: string | null
  vat_number: string | null
  legal_form: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  postal_code: string | null
  country: string
  phone: string | null
  email: string | null
  website: string | null
  logo_url: string | null
  iban: string | null
  bic: string | null
  bank_name: string | null
  payment_conditions: string | null
  currency: string
  created_at: string
  updated_at: string | null
}

class ApiCompanyTransformer {
  transform(company: Company): ApiCompanyShape {
    return {
      id: publicIdCodec.encode('company', company.id),
      legal_name: company.legalName,
      trade_name: company.tradeName,
      siren: company.siren,
      siret: company.siret,
      vat_number: company.vatNumber,
      legal_form: company.legalForm,
      address_line1: company.addressLine1,
      address_line2: company.addressLine2,
      city: company.city,
      postal_code: company.postalCode,
      country: company.country,
      phone: company.phone,
      email: company.email,
      website: company.website,
      logo_url: company.logoUrl,
      iban: company.iban,
      bic: company.bic,
      bank_name: company.bankName,
      payment_conditions: company.paymentConditions,
      currency: company.currency,
      created_at: company.createdAt.toISO() ?? '',
      updated_at: company.updatedAt?.toISO() ?? null,
    }
  }
}

export default new ApiCompanyTransformer()
