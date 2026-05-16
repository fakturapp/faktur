import type { HttpContext } from '@adonisjs/core/http'
import Expense from '#models/expense/expense'
import {
  decryptModelFields,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'
import apiResponse from '#services/api/api_response'
import apiExpenseTransformer from '#transformers/api_v2/api_expense_transformer'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'

export default class Show {
  async handle(ctx: HttpContext) {
    const team = ctx.team!
    const dek = ctx.dek!

    let internalId: string
    try {
      internalId = publicIdCodec.decode('expense', ctx.params.id)
    } catch (err) {
      if (err instanceof PublicIdParseError) {
        return apiResponse.notFound(
          ctx.response,
          'resource_not_found',
          'Expense not found',
          ctx.requestId
        )
      }
      throw err
    }

    const expense = await Expense.query()
      .where('id', internalId)
      .where('team_id', team.id)
      .first()
    if (!expense) {
      return apiResponse.notFound(
        ctx.response,
        'resource_not_found',
        'Expense not found',
        ctx.requestId
      )
    }
    decryptModelFields(expense, [...ENCRYPTED_FIELDS.expense], dek)
    return apiResponse.ok(ctx.response, apiExpenseTransformer.transform(expense))
  }
}
