import type { HttpContext } from '@adonisjs/core/http'
import EmailAccount from '#models/email/email_account'

export default class List {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const accounts = await EmailAccount.query()
      .where('team_id', teamId)
      .orderBy('is_default', 'desc')
      .orderBy('created_at', 'asc')

    const result = accounts.map((a) => ({
      id: a.id,
      provider: a.provider,
      email: a.email,
      displayName: a.displayName,
      isDefault: a.isDefault,
      isActive: a.isActive,
      createdAt: a.createdAt,
    }))

    return response.ok({ emailAccounts: result })
  }
}
