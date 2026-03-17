import type { HttpContext } from '@adonisjs/core/http'
import EmailAccount from '#models/email/email_account'

export default class Delete {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const account = await EmailAccount.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .first()

    if (!account) {
      return response.notFound({ message: 'Email account not found' })
    }

    const wasDefault = account.isDefault
    await account.delete()

    // If the deleted account was default, promote the next one
    if (wasDefault) {
      const nextAccount = await EmailAccount.query()
        .where('team_id', teamId)
        .orderBy('created_at', 'asc')
        .first()

      if (nextAccount) {
        nextAccount.isDefault = true
        await nextAccount.save()
      }
    }

    return response.ok({ message: 'Email account disconnected' })
  }
}
