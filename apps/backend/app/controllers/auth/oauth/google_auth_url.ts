import type { HttpContext } from '@adonisjs/core/http'
import GoogleAuthService from '#services/auth/google_auth_service'
import EncryptionService from '#services/encryption/encryption_service'

export default class GoogleAuthUrl {
  async handle({ request, response }: HttpContext) {
    const returnTo = request.input('returnTo', '/dashboard')

    const state = EncryptionService.encrypt(
      JSON.stringify({ intent: 'login', returnTo, ts: Date.now() })
    )

    const url = GoogleAuthService.getAuthUrl(state)

    return response.ok({ url })
  }
}
