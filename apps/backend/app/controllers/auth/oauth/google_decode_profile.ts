import type { HttpContext } from '@adonisjs/core/http'
import GoogleAuthService from '#services/auth/google_auth_service'

export default class GoogleDecodeProfile {
  async handle({ request, response }: HttpContext) {
    const { googleData } = request.only(['googleData'])

    if (!googleData) {
      return response.badRequest({ message: 'Missing google data' })
    }

    try {
      const profile = GoogleAuthService.decryptProfileData(googleData)
      return response.ok({
        email: profile.email,
        fullName: profile.name,
        avatarUrl: profile.picture,
        googleSub: profile.sub,
      })
    } catch {
      return response.badRequest({ message: 'Invalid or expired Google data' })
    }
  }
}
