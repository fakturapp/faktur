import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class TwoFactorVerifiedMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    const user = auth.user!

    if (!user.twoFactorEnabled) {
      return response.forbidden({
        message: 'Two-factor authentication is required for this action',
        code: 'TWO_FACTOR_REQUIRED',
      })
    }

    await next()
  }
}
