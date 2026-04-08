import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import mail from '@adonisjs/mail/services/main'
import TeamMember from '#models/team/team_member'
import keyStore from '#services/crypto/key_store'
import AccountDeletedNotification from '#mails/account_deleted_notification'
import { validateDeletionSession } from './_helpers.js'

const confirmValidator = vine.compile(
  vine.object({
    confirmText: vine.string().trim(),
  })
)

export default class Confirm {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const token = request.header('x-deletion-token')

    const error = validateDeletionSession(user, token, 5)
    if (error) return response.badRequest({ message: error })

    const payload = await request.validateUsing(confirmValidator)

    if (payload.confirmText.toLowerCase() !== 'supprimer') {
      return response.unprocessableEntity({ message: 'Tapez "supprimer" pour confirmer' })
    }

    const ownedTeams = await TeamMember.query()
      .where('userId', user.id)
      .where('role', 'super_admin')
      .where('status', 'active')

    if (ownedTeams.length > 0) {
      return response.badRequest({
        message: 'Vous possédez encore des équipes. Supprimez-les ou transférez-les avant de continuer.',
      })
    }

    const email = user.email
    const name = user.fullName || undefined

    keyStore.clear(user.id)

    user.currentTeamId = null
    await user.save()

    await user.delete()

    await mail.sendLater(new AccountDeletedNotification(email, name))

    return response.ok({ message: 'Compte supprimé définitivement' })
  }
}
