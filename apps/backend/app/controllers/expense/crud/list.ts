import type { HttpContext } from '@adonisjs/core/http'
import Expense from '#models/expense/expense'
import ExpenseTransformer from '#transformers/expense_transformer'
import { decryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'

export default class List {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const page = request.input('page', 1)
    const perPage = request.input('perPage', 50)
    const search = request.input('search', '')
    const categoryId = request.input('categoryId', '')
    const startDate = request.input('startDate', '')
    const endDate = request.input('endDate', '')

    const query = Expense.query()
      .where('team_id', teamId)
      .preload('category')
      .orderBy('expense_date', 'desc')

    if (categoryId) {
      query.where('category_id', categoryId)
    }

    if (startDate) {
      query.where('expense_date', '>=', startDate)
    }

    if (endDate) {
      query.where('expense_date', '<=', endDate)
    }

    const expenses = await query.paginate(page, perPage)

    for (const expense of expenses) {
      decryptModelFields(expense, [...ENCRYPTED_FIELDS.expense], dek)
    }

    let items = expenses.all()
    if (search) {
      const s = search.toLowerCase()
      items = items.filter(
        (e) => e.description.toLowerCase().includes(s) || e.supplier?.toLowerCase().includes(s)
      )
    }

    const totalAmount = items.reduce((sum, e) => sum + Number(e.amount), 0)
    const totalVat = items.reduce((sum, e) => sum + Number(e.vatAmount), 0)

    return response.ok({
      expenses: await ctx.serialize.withoutWrapping(ExpenseTransformer.transform(items)),
      meta: {
        total: expenses.total,
        perPage: expenses.perPage,
        currentPage: expenses.currentPage,
        lastPage: expenses.lastPage,
      },
      totals: {
        amount: Math.round(totalAmount * 100) / 100,
        vat: Math.round(totalVat * 100) / 100,
        ttc: Math.round((totalAmount + totalVat) * 100) / 100,
      },
    })
  }
}
