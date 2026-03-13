import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class EmailVerifiedMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    const user = auth.user!

    if (!user.emailVerified) {
      return response.forbidden({
        message: 'Email verification is required for this action',
        code: 'EMAIL_NOT_VERIFIED',
      })
    }

    await next()
  }
}
