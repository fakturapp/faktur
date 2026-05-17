import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import apiKeyService from '#services/api/api_key_service'
import apiLogger from '#services/api/api_logger'

export default class ApiRequestLoggerMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const startedAt = ctx.apiStartedAt ?? Date.now()

    try {
      await next()
    } finally {
      const apiKey = ctx.apiKey
      if (apiKey) {
        const latency = Date.now() - startedAt
        const status = ctx.response.getStatus()
        const errorCode = status >= 400 ? this.extractErrorCode(ctx.response.getBody()) : null

        await apiLogger.record({
          apiKeyId: apiKey.id,
          method: ctx.request.method(),
          path: ctx.request.url(true),
          status,
          latencyMs: latency,
          ip: ctx.apiClientIp ?? ctx.request.ip(),
          requestId: ctx.requestId ?? '',
          errorCode,
        })

        if (status < 500) {
          apiKeyService.touchUsage(apiKey.id, ctx.apiClientIp ?? ctx.request.ip()).catch(() => {})
        }
      }
    }
  }

  private extractErrorCode(body: unknown): string | null {
    if (!body || typeof body !== 'object') return null
    const err = (body as any).error
    if (!err || typeof err !== 'object') return null
    const code = err.code
    return typeof code === 'string' ? code : null
  }
}
