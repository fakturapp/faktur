import type { HttpContext } from '@adonisjs/core/http'
import BankAccount from '#models/team/bank_account'
import {
  decryptModelFields,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'
import apiResponse from '#services/api/api_response'
import apiBankAccountTransformer from '#transformers/api_v2/api_bank_account_transformer'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'

export default class Show {
  async handle(ctx: HttpContext) {
    const team = ctx.team!
    const dek = ctx.dek!

    let internalId: string
    try {
      internalId = publicIdCodec.decode('bank_account', ctx.params.id)
    } catch (err) {
      if (err instanceof PublicIdParseError) {
        return apiResponse.notFound(
          ctx.response,
          'resource_not_found',
          'Bank account not found',
          ctx.requestId
        )
      }
      throw err
    }

    const account = await BankAccount.query()
      .where('id', internalId)
      .where('team_id', team.id)
      .first()
    if (!account) {
      return apiResponse.notFound(
        ctx.response,
        'resource_not_found',
        'Bank account not found',
        ctx.requestId
      )
    }
    decryptModelFields(account, [...ENCRYPTED_FIELDS.bankAccount], dek)
    return apiResponse.ok(ctx.response, apiBankAccountTransformer.transform(account))
  }
}
