import type { HttpContext } from '@adonisjs/core/http'
import BankAccount from '#models/team/bank_account'
import {
  decryptModelFieldsArray,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'
import apiResponse from '#services/api/api_response'
import apiBankAccountTransformer from '#transformers/api_v2/api_bank_account_transformer'

export default class List {
  async handle(ctx: HttpContext) {
    const team = ctx.team!
    const dek = ctx.dek!

    const accounts = await BankAccount.query()
      .where('team_id', team.id)
      .orderBy('is_default', 'desc')
      .orderBy('created_at', 'asc')

    decryptModelFieldsArray(accounts, [...ENCRYPTED_FIELDS.bankAccount], dek)

    return apiResponse.list(
      ctx.response,
      apiBankAccountTransformer.transformMany(accounts),
      { has_more: false, next_cursor: null, limit: accounts.length }
    )
  }
}
