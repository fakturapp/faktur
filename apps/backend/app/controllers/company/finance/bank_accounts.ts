import type { HttpContext } from '@adonisjs/core/http'
import BankAccount from '#models/team/bank_account'
import Invoice from '#models/invoice/invoice'
import EncryptionService from '#services/encryption/encryption_service'
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
  async index({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

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

      // Decrypt if needed to get raw values for masking
      if (a.isEncrypted) {
        if (iban) {
          try {
            iban = EncryptionService.decrypt(iban)
          } catch {
            iban = null
          }
        }
        if (bic) {
          try {
            bic = EncryptionService.decrypt(bic)
          } catch {
            bic = null
          }
        }
      }

      return {
        id: a.id,
        label: a.label,
        bankName: a.bankName,
        ibanMasked: iban ? maskIban(iban) : null,
        bicMasked: bic ? maskBic(bic) : null,
        isEncrypted: a.isEncrypted,
        isDefault: a.isDefault,
        createdAt: a.createdAt,
      }
    })

    return response.ok({ bankAccounts: result })
  }

  async show({ auth, params, response }: HttpContext) {
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

    let iban = account.iban
    let bic = account.bic

    if (account.isEncrypted) {
      if (iban) {
        try {
          iban = EncryptionService.decrypt(iban)
        } catch {
          iban = null
        }
      }
      if (bic) {
        try {
          bic = EncryptionService.decrypt(bic)
        } catch {
          bic = null
        }
      }
    }

    return response.ok({
      bankAccount: {
        id: account.id,
        label: account.label,
        bankName: account.bankName,
        iban,
        bic,
        isEncrypted: account.isEncrypted,
        isDefault: account.isDefault,
      },
    })
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const payload = await request.validateUsing(createBankAccountValidator)

    let iban = payload.iban || null
    let bic = payload.bic || null

    if (payload.isEncrypted) {
      if (iban) iban = EncryptionService.encrypt(iban)
      if (bic) bic = EncryptionService.encrypt(bic)
    }

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
      isEncrypted: payload.isEncrypted ?? false,
      isDefault: payload.isDefault ?? false,
    })

    return response.created({
      message: 'Bank account created',
      bankAccount: {
        id: account.id,
        label: account.label,
        bankName: account.bankName,
        isEncrypted: account.isEncrypted,
        isDefault: account.isDefault,
      },
    })
  }

  async update({ auth, params, request, response }: HttpContext) {
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

    const payload = await request.validateUsing(updateBankAccountValidator)

    let iban = payload.iban || null
    let bic = payload.bic || null

    if (payload.isEncrypted) {
      if (iban) iban = EncryptionService.encrypt(iban)
      if (bic) bic = EncryptionService.encrypt(bic)
    }

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
      isEncrypted: payload.isEncrypted ?? false,
      isDefault: payload.isDefault ?? false,
    })
    await account.save()

    return response.ok({
      message: 'Bank account updated',
      bankAccount: {
        id: account.id,
        label: account.label,
        bankName: account.bankName,
        isEncrypted: account.isEncrypted,
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
      .count('* as total')

    const count = Number(referencedCount[0].$extras.total)
    if (count > 0) {
      return response.conflict({
        message: `Ce compte bancaire est utilisé par ${count} facture(s) et ne peut pas être supprimé.`,
      })
    }

    await account.delete()

    return response.ok({ message: 'Bank account deleted' })
  }
}
