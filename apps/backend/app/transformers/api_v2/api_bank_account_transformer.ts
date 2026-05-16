import type BankAccount from '#models/team/bank_account'
import publicIdCodec from '#services/api/public_id_codec'

export interface ApiBankAccountShape {
  id: string
  label: string
  bank_name: string | null
  iban: string | null
  bic: string | null
  is_default: boolean
  created_at: string
  updated_at: string | null
}

class ApiBankAccountTransformer {
  transform(account: BankAccount): ApiBankAccountShape {
    return {
      id: publicIdCodec.encode('bank_account', account.id),
      label: account.label,
      bank_name: account.bankName,
      iban: account.iban,
      bic: account.bic,
      is_default: account.isDefault,
      created_at: account.createdAt.toISO() ?? '',
      updated_at: account.updatedAt?.toISO() ?? null,
    }
  }

  transformMany(accounts: BankAccount[]): ApiBankAccountShape[] {
    return accounts.map((a) => this.transform(a))
  }
}

export default new ApiBankAccountTransformer()
