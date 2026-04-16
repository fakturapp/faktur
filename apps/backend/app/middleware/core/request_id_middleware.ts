import { randomBytes } from 'node:crypto'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

const REQUEST_ID_REGEX = /^[a-zA-Z0-9_-]{8,128}$/

export default class RequestIdMiddleware {
  handle(ctx: HttpContext, next: NextFn) {
    const incoming = ctx.request.header('x-request-id')
    const requestId =
      typeof incoming === 'string' && REQUEST_ID_REGEX.test(incoming)
        ? incoming
        : `req_${randomBytes(12).toString('hex')}`

    ;(ctx as any).requestId = requestId
    ctx.response.header('X-Request-Id', requestId)

    return next()
  }
}

export function getRequestId(ctx: HttpContext): string | undefined {
  return (ctx as any).requestId
}
