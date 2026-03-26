import type { HttpContext } from '@adonisjs/core/http'
import BankAccount from '#models/team/bank_account'
import Invoice from '#models/invoice/invoice'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import {
  createBankAccountValidator,
  updateBankAccountValidator,
} from '#validators/company/bank_account_validators'

function maskIban(iban: string): string {
  const clean = iban.replace(/\s/g, '')
  if (clean.length <= 8) return '•••• ••••'
  return clean.slice(0, 4) + ' •••• •••• ' + clean.slice(-4)
}

function maskBic(bic: string): string {
  if (bic.length <= 4) return '••••••••'
  return bic.slice(0, 4) + '••••'
}

export default class BankAccounts {
  async index(ctx: HttpContext) {
    const { auth, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const accounts = await BankAccount.query()
      .where('team_id', teamId)
      .orderBy('is_default', 'desc')
      .orderBy('created_at', 'asc')

    const result = accounts.map((a) => {
      let iban = a.iban
      let bic = a.bic

      // Decrypt with zero-access DEK
      if (iban && zeroAccessCryptoService.isEncryptedField(iban)) {
        try {
          iban = zeroAccessCryptoService.decryptField(iban, dek)
        } catch {
          iban = null
        }
      }
      if (bic && zeroAccessCryptoService.isEncryptedField(bic)) {
        try {
          bic = zeroAccessCryptoService.decryptField(bic, dek)
        } catch {
          bic = null
        }
      }

      return {
        id: a.id,
        label: a.label,
        bankName: a.bankName,
        ibanMasked: iban ? maskIban(iban) : null,
        bicMasked: bic ? maskBic(bic) : null,

        isDefault: a.isDefault,
        createdAt: a.createdAt,
      }
    })

    return response.ok({ bankAccounts: result })
  }

  async show(ctx: HttpContext) {
    const { auth, params, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const account = await BankAccount.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .first()

    if (!account) {
      return response.notFound({ message: 'Bank account not found' })
    }

    let iban = account.iban
    let bic = account.bic

    if (iban && zeroAccessCryptoService.isEncryptedField(iban)) {
      try {
        iban = zeroAccessCryptoService.decryptField(iban, dek)
      } catch {
        iban = null
      }
    }
    if (bic && zeroAccessCryptoService.isEncryptedField(bic)) {
      try {
        bic = zeroAccessCryptoService.decryptField(bic, dek)
      } catch {
        bic = null
      }
    }

    return response.ok({
      bankAccount: {
        id: account.id,
        label: account.label,
        bankName: account.bankName,
        iban,
        bic,

        isDefault: account.isDefault,
      },
    })
  }

  async store(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const payload = await request.validateUsing(createBankAccountValidator)

    // Always encrypt with zero-access DEK
    let iban: string | null = payload.iban || null
    let bic: string | null = payload.bic || null

    if (iban) iban = zeroAccessCryptoService.encryptField(iban, dek)
    if (bic) bic = zeroAccessCryptoService.encryptField(bic, dek)

    // If setting as default, unset other defaults
    if (payload.isDefault) {
      await BankAccount.query()
        .where('team_id', teamId)
        .where('is_default', true)
        .update({ isDefault: false })
    }

    const account = await BankAccount.create({
      teamId,
      label: payload.label,
      bankName: payload.bankName || null,
      iban,
      bic,
      isDefault: payload.isDefault ?? false,
    })

    return response.created({
      message: 'Bank account created',
      bankAccount: {
        id: account.id,
        label: account.label,
        bankName: account.bankName,

        isDefault: account.isDefault,
      },
    })
  }

  async update(ctx: HttpContext) {
    const { auth, params, request, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const account = await BankAccount.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .first()

    if (!account) {
      return response.notFound({ message: 'Bank account not found' })
    }

    const payload = await request.validateUsing(updateBankAccountValidator)

    let iban: string | null = payload.iban || null
    let bic: string | null = payload.bic || null

    if (iban) iban = zeroAccessCryptoService.encryptField(iban, dek)
    if (bic) bic = zeroAccessCryptoService.encryptField(bic, dek)

    // If setting as default, unset other defaults
    if (payload.isDefault && !account.isDefault) {
      await BankAccount.query()
        .where('team_id', teamId)
        .where('is_default', true)
        .update({ isDefault: false })
    }

    account.merge({
      label: payload.label,
      bankName: payload.bankName || null,
      iban,
      bic,
      isDefault: payload.isDefault ?? false,
    })
    await account.save()

    return response.ok({
      message: 'Bank account updated',
      bankAccount: {
        id: account.id,
        label: account.label,
        bankName: account.bankName,

        isDefault: account.isDefault,
      },
    })
  }

  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const account = await BankAccount.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .first()

    if (!account) {
      return response.notFound({ message: 'Bank account not found' })
    }

    // Block deletion if referenced by invoices
    const referencedCount = await Invoice.query()
      .where('bank_account_id', account.id)
      .count('* as cnt')

    const count = Number(referencedCount[0].$extras.cnt)
    if (count > 0) {
      return response.conflict({
        message: `Ce compte bancaire est utilisé par ${count} facture(s) et ne peut pas être supprimé.`,
      })
    }

    await account.delete()

    return response.ok({ message: 'Bank account deleted' })
  }
}
