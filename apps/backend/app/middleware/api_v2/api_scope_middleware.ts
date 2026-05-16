import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import scopeChecker from '#services/api/scope_checker'
import apiResponse from '#services/api/api_response'

export default class ApiScopeMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options?: string[] | { scopes?: string[] }
  ) {
    const required = Array.isArray(options)
      ? options
      : Array.isArray(options?.scopes)
        ? options!.scopes!
        : []

    if (required.length === 0) return next()

    const apiKey = ctx.apiKey
    if (!apiKey) {
      return apiResponse.unauthorized(
        ctx.response,
        'invalid_token',
        'No API key on this request.',
        ctx.requestId
      )
    }

    const missing = required.filter((s) => !scopeChecker.hasScope(apiKey.scopes, s))
    if (missing.length > 0) {
      return apiResponse.forbidden(
        ctx.response,
        'insufficient_scope',
        `Missing required scope: ${missing.join(', ')}`,
        ctx.requestId
      )
    }

    return next()
  }
}
