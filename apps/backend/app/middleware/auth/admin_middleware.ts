import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { isAdminEmail } from '#services/auth/is_admin'

export default class AdminMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    const user = auth.user!

    if (!isAdminEmail(user.email)) {
      return response.forbidden({
        message: 'Admin access required',
        code: 'ADMIN_REQUIRED',
      })
    }

    await next()
  }
}
