import type { HttpContext } from '@adonisjs/core/http'
import EmailAccount from '#models/email/email_account'

export default class SetDefault {
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

    // Unset other defaults
    await EmailAccount.query()
      .where('team_id', teamId)
      .where('is_default', true)
      .update({ isDefault: false })

    account.isDefault = true
    await account.save()

    return response.ok({ message: 'Default email account updated' })
  }
}
