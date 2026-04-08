import type { HttpContext } from '@adonisjs/core/http'
import GoogleAuthService from '#services/auth/google_auth_service'
import EncryptionService from '#services/encryption/encryption_service'

export default class LinkProvider {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!

    const state = EncryptionService.encrypt(
      JSON.stringify({ intent: 'link', userId: user.id, ts: Date.now() })
    )

    const url = GoogleAuthService.getAuthUrl(state)

    return response.ok({ url })
  }
}
