import type { HttpContext } from '@adonisjs/core/http'
import Company from '#models/team/company'
import BankAccount from '#models/team/bank_account'
import { createCompanyValidator } from '#validators/auth/onboarding_validators'
import { encryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'

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

    if (payload.iban || payload.bic || payload.bankName) {
      let encryptedIban: string | null = payload.iban ?? null
      let encryptedBic: string | null = payload.bic ?? null

      if (encryptedIban) encryptedIban = zeroAccessCryptoService.encryptField(encryptedIban, dek)
      if (encryptedBic) encryptedBic = zeroAccessCryptoService.encryptField(encryptedBic, dek)

      await BankAccount.create({
        teamId: user.currentTeamId,
        label: payload.bankName || 'Compte principal',
        bankName: payload.bankName ?? null,
        iban: encryptedIban,
        bic: encryptedBic,
        isDefault: true,
      })
    }

    return response.created({
      message: 'Company created successfully',
      company: {
        id: company.id,
        legalName: company.legalName,
      },
    })
  }
}
