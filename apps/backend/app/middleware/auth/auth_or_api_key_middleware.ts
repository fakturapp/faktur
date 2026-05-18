import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import apiKeyService from '#services/api/api_key_service'
import User from '#models/account/user'
import env from '#start/env'
import { isAdminEmail } from '#services/auth/is_admin'

const ADMIN_ONLY_ALLOWLIST = ['/auth/me', '/auth/logout']

export default class AuthOrApiKeyMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    const header = ctx.request.header('authorization')
    const token = apiKeyService.extractFromHeader(header)

    if (token && apiKeyService.looksLikeApiKey(token)) {
      const apiKey = await apiKeyService.findActiveByToken(token)
      if (!apiKey) {
        return ctx.response.unauthorized({
          message: 'API key is invalid, revoked, or expired',
          code: 'invalid_token',
        })
      }

      const userId = (apiKey as unknown as { createdByUserId?: string | null }).createdByUserId ?? null
      const user = userId ? await User.find(userId) : null
      if (!user) {
        return ctx.response.unauthorized({
          message: 'API key creator no longer exists',
          code: 'orphan_api_key',
        })
      }

      user.currentTeamId = apiKey.teamId
      await user.save()
      ;(ctx.auth as unknown as { user: User }).user = user
      ctx.apiKey = apiKey
      return next()
    }

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
