import type { HttpContext } from '@adonisjs/core/http'
import Company from '#models/team/company'
import BankAccount from '#models/team/bank_account'
import { updateBankValidator } from '#validators/auth/onboarding_validators'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import { encryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'

export default class Bank {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const dek: Buffer = (ctx as any).dek

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const company = await Company.findBy('teamId', user.currentTeamId)

    if (!company) {
      return response.notFound({ message: 'No company found' })
    }

    const payload = await request.validateUsing(updateBankValidator)

    if (payload.iban !== undefined)
      company.iban = payload.iban ? zeroAccessCryptoService.encryptField(payload.iban, dek) : null
    if (payload.bic !== undefined)
      company.bic = payload.bic ? zeroAccessCryptoService.encryptField(payload.bic, dek) : null
    if (payload.bankName !== undefined)
      company.bankName = payload.bankName
        ? zeroAccessCryptoService.encryptField(payload.bankName, dek)
        : null

    await company.save()

    if (payload.iban || payload.bic || payload.bankName) {
      let defaultAccount = await BankAccount.query()
        .where('team_id', user.currentTeamId)
        .where('is_default', true)
        .first()

      const bankData: Record<string, any> = {
        teamId: user.currentTeamId,
        label: payload.bankName || 'Compte principal',
        bankName: payload.bankName || null,
        iban: payload.iban || null,
        bic: payload.bic || null,
        isDefault: true,
      }

      encryptModelFields(bankData, [...ENCRYPTED_FIELDS.bankAccount], dek)
      if (
        bankData.bankName &&
        typeof bankData.bankName === 'string' &&
        !zeroAccessCryptoService.isEncryptedField(bankData.bankName)
      ) {
        bankData.bankName = zeroAccessCryptoService.encryptField(bankData.bankName, dek)
      }

      if (defaultAccount) {
        defaultAccount.merge(bankData as Partial<typeof defaultAccount>)
        await defaultAccount.save()
      } else {
        await BankAccount.create(bankData)
      }
    }

    return response.ok({
      message: 'Bank details updated successfully',
      company: {
        iban: payload.iban ?? null,
        bic: payload.bic ?? null,
        bankName: payload.bankName ?? null,
      },
    })
  }
}
