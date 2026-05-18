import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import apiCreditService, { CREDIT_LIMITS } from '#services/api/api_credit_service'
import apiResponse from '#services/api/api_response'

const SKIP_PATH_SUFFIXES = ['/ping', '/openapi.json', '/openapi.yaml', '/docs']

export default class ApiCreditMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const apiKey = ctx.apiKey
    if (!apiKey) return next()

    const path = ctx.request.url(true)
    if (SKIP_PATH_SUFFIXES.some((suffix) => path.endsWith(suffix))) {
      return next()
    }

    const teamId = apiKey.teamId
    const userId = (apiKey as unknown as { createdByUserId?: string | null }).createdByUserId ?? null

    const check = await apiCreditService.check(teamId, userId)

    ctx.response.header('X-Credits-Daily-Limit', String(CREDIT_LIMITS.PER_DAY))
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
            per_day: CREDIT_LIMITS.PER_DAY,
            per_week: CREDIT_LIMITS.PER_WEEK,
          },
        },
        ctx.requestId
      )
    }

    ctx.response.header('X-Credits-Daily-Remaining', String(check.daily_remaining))
    ctx.response.header('X-Credits-Weekly-Remaining', String(check.weekly_remaining))
    ctx.response.header('X-Credits-Minute-Remaining', String(check.minute_remaining))

    await apiCreditService.charge(teamId, userId, 1)
    return next()
  }
}
