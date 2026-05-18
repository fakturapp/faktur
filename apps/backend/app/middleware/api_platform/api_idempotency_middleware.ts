import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import apiIdempotency, { IDEMPOTENCY_HEADER } from '#services/api/api_idempotency'
import apiResponse from '#services/api/api_response'

const SUPPORTED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export default class ApiIdempotencyMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const apiKey = ctx.apiKey
    if (!apiKey) return next()

    const method = ctx.request.method().toUpperCase()
    if (!SUPPORTED_METHODS.has(method)) return next()

    const idemKey = ctx.request.header(IDEMPOTENCY_HEADER)
    if (!idemKey) return next()

    const rawBody = JSON.stringify(ctx.request.body() ?? {})
    ctx.apiRawBody = rawBody

    const outcome = await apiIdempotency.lookup(
      apiKey.id,
      idemKey,
      method,
      ctx.request.url(true),
      rawBody
    )

    if (outcome.kind === 'conflict') {
      return apiResponse.conflict(
        ctx.response,
        'idempotency_replay',
        'Idempotency key was reused with a different request (method, path, or body).',
        ctx.requestId
      )
    }

    if (outcome.kind === 'replay') {
      ctx.response.header('Faktur-Idempotency-Replay', 'true')
      try {
        const body = JSON.parse(outcome.stored.body)
        return ctx.response.status(outcome.stored.status).send(body)
      } catch {
        return ctx.response.status(outcome.stored.status).send(outcome.stored.body)
      }
    }

    await next()

    const status = ctx.response.getStatus()
    if (status < 200 || status >= 300) return
    const responseBody = ctx.response.getBody()
    const responseBodyStr =
      typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody ?? {})
    await apiIdempotency.store({
      key: idemKey,
      apiKeyId: apiKey.id,
      method,
      path: ctx.request.url(true),
      rawBody,
      responseStatus: status,
      responseBody: responseBodyStr,
    })
  }
}
