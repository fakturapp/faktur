import type { HttpContext } from '@adonisjs/core/http'
import EmailAccount from '#models/email/email_account'
import EmailAccountTransformer from '#transformers/email_account_transformer'

export default class List {
  async handle(ctx: HttpContext) {
    const { auth, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const accounts = await EmailAccount.query()
      .where('team_id', teamId)
      .orderBy('is_default', 'desc')
      .orderBy('created_at', 'asc')

    return response.ok({
      emailAccounts: await ctx.serialize.withoutWrapping(
        EmailAccountTransformer.transform(accounts)
      ),
    })
  }
}
