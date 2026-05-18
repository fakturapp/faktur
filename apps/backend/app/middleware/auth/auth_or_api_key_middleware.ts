import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import apiKeyService from '#services/api/api_key_service'
import apiCreditService, { CREDIT_LIMITS } from '#services/api/api_credit_service'
import apiResponse from '#services/api/api_response'
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

      const guard = ctx.auth.use('api') as unknown as Record<string, unknown>
      Object.defineProperty(guard, 'user', {
        value: user,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(guard, 'isAuthenticated', {
        value: true,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(guard, 'isLoggedOut', {
        value: false,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(guard, 'authenticationAttempted', {
        value: true,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(ctx.auth, 'user', {
        value: user,
        writable: true,
        configurable: true,
      })
      ctx.apiKey = apiKey

      const check = await apiCreditService.check(apiKey.teamId, user.id)
      ctx.response.header('X-Credits-Session-Limit', String(CREDIT_LIMITS.PER_SESSION))
      ctx.response.header('X-Credits-Session-Window-Hours', String(CREDIT_LIMITS.SESSION_HOURS))
      ctx.response.header('X-Credits-Weekly-Limit', String(CREDIT_LIMITS.PER_WEEK))
      ctx.response.header('X-Credits-Per-Minute-Limit', String(CREDIT_LIMITS.PER_MINUTE))

      if (!check.ok) {
        ctx.response.header('Retry-After', String(check.retry_after_seconds))
        return apiResponse.rateLimited(
          ctx.response,
          check.retry_after_seconds,
          {
            reason: check.reason,
            retry_after_seconds: check.retry_after_seconds,
            limits: {
              per_minute: CREDIT_LIMITS.PER_MINUTE,
              per_session: CREDIT_LIMITS.PER_SESSION,
              session_hours: CREDIT_LIMITS.SESSION_HOURS,
              per_week: CREDIT_LIMITS.PER_WEEK,
            },
          },
          ctx.requestId
        )
      }

      ctx.response.header('X-Credits-Session-Remaining', String(check.session_remaining))
      ctx.response.header('X-Credits-Weekly-Remaining', String(check.weekly_remaining))
      ctx.response.header('X-Credits-Minute-Remaining', String(check.minute_remaining))

      await apiCreditService.charge(apiKey.teamId, user.id, 1)
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
