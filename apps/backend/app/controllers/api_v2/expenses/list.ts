import type { HttpContext } from '@adonisjs/core/http'
import Expense from '#models/expense/expense'
import { decryptModelFieldsArray, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'
import apiResponse from '#services/api/api_response'
import apiPagination from '#services/api/api_pagination'
import apiExpenseTransformer from '#transformers/api_v2/api_expense_transformer'
import { listExpensesValidator } from '#validators/api_v2/expense_validators'

export default class List {
  async handle(ctx: HttpContext) {
    const team = ctx.team!
    const dek = ctx.dek!

    const payload = await listExpensesValidator.validate(ctx.request.qs())
    const { limit, cursor } = apiPagination.parse({
      limit: payload.limit,
      cursor: payload.cursor,
    })

    const query = Expense.query()
      .where('team_id', team.id)
      .limit(limit + 1)

    if (payload.date_after) query.where('expense_date', '>=', payload.date_after)
    if (payload.date_before) query.where('expense_date', '<=', payload.date_before)
    if (payload.deductible_only) query.where('is_deductible', true)

    if (cursor) {
      query.where((q) => {
        q.where('created_at', '<', cursor.created_at).orWhere((sub) => {
          sub.where('created_at', cursor.created_at).where('id', '<', cursor.id)
        })
      })
    }

    const sortKey = payload.sort ?? '-created_at'
    if (sortKey === 'created_at') query.orderBy('created_at', 'asc').orderBy('id', 'asc')
    else if (sortKey === 'expense_date') query.orderBy('expense_date', 'asc').orderBy('id', 'asc')
    else if (sortKey === '-expense_date')
      query.orderBy('expense_date', 'desc').orderBy('id', 'desc')
    else query.orderBy('created_at', 'desc').orderBy('id', 'desc')

    const rows = await query
    decryptModelFieldsArray(rows, [...ENCRYPTED_FIELDS.expense], dek)

    const page = apiPagination.buildNext(rows, limit)
    const data = apiExpenseTransformer.transformMany(page.items)

    return apiResponse.list(ctx.response, data, {
      has_more: page.hasMore,
      next_cursor: page.nextCursor,
      limit,
    })
  }
}
