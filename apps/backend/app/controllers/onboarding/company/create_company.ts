import type { HttpContext } from '@adonisjs/core/http'
import Company from '#models/team/company'
import { createCompanyValidator } from '#validators/auth/onboarding_validators'
import { encryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'

export default class CreateCompany {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const dek: Buffer = (ctx as any).dek

    if (!user.currentTeamId) {
      return response.badRequest({ message: 'You must create a team first' })
    }

    const existing = await Company.findBy('teamId', user.currentTeamId)
    if (existing) {
      return response.conflict({ message: 'Company already exists for this team' })
    }

    const payload = await request.validateUsing(createCompanyValidator)

    const companyData: Record<string, any> = {
      teamId: user.currentTeamId,
      legalName: payload.legalName,
      tradeName: payload.tradeName ?? null,
      siren: payload.siren ?? null,
      siret: payload.siret ?? null,
      vatNumber: payload.vatNumber ?? null,
      legalForm: payload.legalForm ?? null,
      addressLine1: payload.addressLine1 ?? null,
      addressLine2: payload.addressLine2 ?? null,
      city: payload.city ?? null,
      postalCode: payload.postalCode ?? null,
      country: payload.country ?? 'FR',
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      website: payload.website ?? null,
      iban: payload.iban ?? null,
      bic: payload.bic ?? null,
      bankName: payload.bankName ?? null,
      paymentConditions: payload.paymentConditions ?? null,
      currency: payload.currency ?? 'EUR',
    }

    encryptModelFields(companyData, [...ENCRYPTED_FIELDS.company], dek)

    const company = await Company.create(companyData)

    return response.created({
      message: 'Company created successfully',
      company: {
        id: company.id,
        legalName: company.legalName,
      },
    })
  }
}
