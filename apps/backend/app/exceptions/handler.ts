import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { errors as authErrors } from '@adonisjs/auth'
import { errors as vineErrors } from '@vinejs/vine'
import { ApiError } from './api_error.js'
import { ERROR_CODES, type ErrorCode, type ErrorType, type ErrorVisibility } from './error_codes.js'
import { getRequestId } from '#middleware/core/request_id_middleware'

interface SerializedError {
  type: ErrorType
  message: string
  details: unknown
  error_visibility: ErrorVisibility
  error_code: ErrorCode | string
  request_id: string | null
}

function fallback(code: ErrorCode, message: string, details: unknown = null): Omit<SerializedError, 'request_id'> {
  const def = ERROR_CODES[code]
  return {
    type: def.type,
    message,
    details,
    error_visibility: def.visibility,
    error_code: code,
  }
}

function serialize(error: unknown, ctx: HttpContext): { status: number; body: { error: SerializedError } } {
  const requestId = getRequestId(ctx) ?? null

  if (error instanceof ApiError) {
    const def = ERROR_CODES[error.errorCode]
    return {
      status: def.status,
      body: {
        error: {
          type: error.errorType,
          message: error.message,
          details: error.details,
          error_visibility: error.visibility,
          error_code: error.errorCode,
          request_id: requestId,
        },
      },
    }
  }

  if (error instanceof vineErrors.E_VALIDATION_ERROR) {
    return {
      status: 422,
      body: {
        error: {
          ...fallback('validation_failed', 'Request validation failed', { errors: error.messages }),
          request_id: requestId,
        },
      },
    }
  }

  if (error instanceof authErrors.E_UNAUTHORIZED_ACCESS) {
    return {
      status: 401,
      body: {
        error: {
          ...fallback('account_session_invalid', 'Invalid authorization'),
          request_id: requestId,
        },
      },
    }
  }

  if (error instanceof authErrors.E_INVALID_CREDENTIALS) {
    return {
      status: 401,
      body: {
        error: {
          ...fallback('account_credentials_invalid', 'Invalid email or password'),
          request_id: requestId,
        },
      },
    }
  }

  if (isObjectWithStatusAndCode(error)) {
    const status = typeof error.status === 'number' ? error.status : 500
    const code = typeof error.code === 'string' ? error.code : 'E_INTERNAL_ERROR'

    if (status === 429 || code === 'E_TOO_MANY_REQUESTS') {
      return {
        status: 429,
        body: {
          error: {
            ...fallback('rate_limit_exceeded', 'Too many requests, please slow down'),
            request_id: requestId,
          },
        },
      }
    }

    if (status === 404) {
      return {
        status: 404,
        body: {
          error: {
            ...fallback(
              'resource_not_found',
              typeof error.message === 'string' ? error.message : 'Resource not found'
            ),
            request_id: requestId,
          },
        },
      }
    }

    if (status === 403) {
      return {
        status: 403,
        body: {
          error: {
            ...fallback(
              'permission_denied',
              typeof error.message === 'string' ? error.message : "You don't have permission"
            ),
            request_id: requestId,
          },
        },
      }
    }

    if (status === 400) {
      return {
        status: 400,
        body: {
          error: {
            ...fallback(
              'invalid_request',
              typeof error.message === 'string' ? error.message : 'Invalid request'
            ),
            request_id: requestId,
          },
        },
      }
    }
  }

  const message = app.inProduction
    ? 'An unexpected error occurred'
    : error instanceof Error
      ? error.message
      : String(error)
  const details =
    app.inProduction || !(error instanceof Error)
      ? null
      : { name: error.name, stack: error.stack?.split('\n').slice(0, 10) }

  return {
    status: 500,
    body: {
      error: {
        ...fallback('internal_error', message, details),
        request_id: requestId,
      },
    },
  }
}

function isObjectWithStatusAndCode(value: unknown): value is { status?: unknown; code?: unknown; message?: unknown } {
  return typeof value === 'object' && value !== null
}

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    const { status, body } = serialize(error, ctx)
    ctx.response.status(status).send(body)
  }

  async report(error: unknown, ctx: HttpContext) {
    if (error instanceof ApiError && error.visibility === 'user_facing' && (error.status ?? 0) < 500) {
      return
    }
    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      return
    }
    if (error instanceof authErrors.E_UNAUTHORIZED_ACCESS) {
      return
    }
    if (error instanceof authErrors.E_INVALID_CREDENTIALS) {
      return
    }
    return super.report(error, ctx)
  }
}
