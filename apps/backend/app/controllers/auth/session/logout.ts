import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/account/user'

export default class Logout {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    return response.ok({ message: 'Logged out successfully' })
  }
}
