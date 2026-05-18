import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import apiKeyService from '#services/api/api_key_service'
import apiLogger from '#services/api/api_logger'
import ApiAuditLog from '#models/api/api_audit_log'
import { realClientIp } from '#services/http/real_client_ip'
import logger from '@adonisjs/core/services/logger'

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
        const ip = ctx.apiClientIp ?? realClientIp(ctx)
        const method = ctx.request.method()
        const path = ctx.request.url(true)

        await apiLogger.record({
          apiKeyId: apiKey.id,
          method,
          path,
          status,
          latencyMs: latency,
          ip,
          requestId: ctx.requestId ?? '',
          errorCode,
        })

        try {
          await ApiAuditLog.create({
            teamId: apiKey.teamId,
            projectId: apiKey.projectId ?? null,
            actorUserId: null,
            actorEmail: null,
            actorName: null,
            action: 'api_call.request',
            targetType: 'api_call',
            targetId: apiKey.id,
            targetLabel: apiKey.name ?? null,
            metadata: {
              method,
              path,
              status,
              latency_ms: latency,
              error_code: errorCode,
              user_agent: ctx.request.header('user-agent') ?? null,
              origin: 'external',
            },
            ip,
            userAgent: ctx.request.header('user-agent') ?? null,
          })
        } catch (err) {
          logger.error({ err }, 'audit_log: failed to record api_call.request')
        }

        if (status < 500) {
          apiKeyService.touchUsage(apiKey.id, ip).catch(() => {})
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
