import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import env from '#start/env'
import { isAdminEmail } from '#services/auth/is_admin'

const ADMIN_ONLY_ALLOWLIST = ['/auth/me', '/auth/logout']

export default class AuthMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    await ctx.auth.authenticateUsing(options.guards)

    if (env.get('ADMIN_ONLY')) {
      const path = ctx.request.url()
      const allowed = ADMIN_ONLY_ALLOWLIST.some((p) => path.endsWith(p))
      if (!allowed && !isAdminEmail(ctx.auth.user?.email)) {
        return ctx.response.forbidden({
          message: 'This instance is restricted to administrators',
          code: 'INSTANCE_ADMIN_ONLY',
        })
      }
    }

    return next()
  }
}
