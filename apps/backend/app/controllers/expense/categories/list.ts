import type { HttpContext } from '@adonisjs/core/http'
import ExpenseCategory from '#models/expense/expense_category'
import ExpenseCategoryTransformer from '#transformers/expense_category_transformer'

export default class List {
  async handle(ctx: HttpContext) {
    const { auth, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const categories = await ExpenseCategory.query().where('team_id', teamId).orderBy('name', 'asc')

    return response.ok({
      categories: await ctx.serialize.withoutWrapping(
        ExpenseCategoryTransformer.transform(categories)
      ),
    })
  }
}
