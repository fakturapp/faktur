import type { HttpContext } from '@adonisjs/core/http'
import GmailOAuthService from '#services/email/gmail_oauth_service'
import EncryptionService from '#services/encryption/encryption_service'

export default class GmailAuthUrl {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const returnTo = request.input('returnTo', '/dashboard/settings/email')

    const state = EncryptionService.encrypt(
      JSON.stringify({ teamId, userId: user.id, returnTo })
    )

    const url = GmailOAuthService.getAuthUrl(state)

    return response.ok({ url })
  }
}
