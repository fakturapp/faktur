import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import apiRateLimiter, { tierFor } from '#services/api/api_rate_limiter'
import apiResponse from '#services/api/api_response'

export default class ApiRateLimitMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const apiKey = ctx.apiKey
    if (!apiKey) return next()

    const outcome = await apiRateLimiter.consume(apiKey.id, apiKey.rateLimitTier)
    const tier = tierFor(apiKey.rateLimitTier)

    ctx.response.header('X-RateLimit-Limit', String(outcome.limit))
    ctx.response.header('X-RateLimit-Remaining', String(Math.max(0, outcome.remaining)))
    ctx.response.header(
      'X-RateLimit-Reset',
      String(Math.floor(Date.now() / 1000) + outcome.resetSeconds)
    )
    ctx.response.header(
      'X-RateLimit-Policy',
      `${tier.perMinute};w=60, ${tier.perHour};w=3600`
    )

    if (!outcome.allowed) {
      return apiResponse.rateLimited(
        ctx.response,
        outcome.resetSeconds,
        {
          limit: outcome.limit,
          window: outcome.window,
          reset_at: new Date((Math.floor(Date.now() / 1000) + outcome.resetSeconds) * 1000)
            .toISOString(),
        },
        ctx.requestId
      )
    }

    return next()
  }
}
