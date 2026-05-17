import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { errors as authErrors } from '@adonisjs/auth'
import { errors as vineErrors } from '@vinejs/vine'
import { ApiError } from '#exceptions/api_error'
import { clearAuthSessionCookies } from '#services/auth/auth_cookie_service'
import { buildStructuredErrorResponse } from '#services/http/error_response_service'
import { logRequestError } from '#services/http/request_error_log_service'
import type { ErrorCode } from '#exceptions/error_codes'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    const serialized = this.serializeError(error, ctx)

    if (
      error instanceof authErrors.E_UNAUTHORIZED_ACCESS ||
      (error instanceof ApiError &&
        (error.errorCode === 'account_session_invalid' ||
          error.errorCode === 'account_session_expired'))
    ) {
      clearAuthSessionCookies(ctx.response)
    }

    await logRequestError(ctx, {
      status: serialized.status,
      errorCode: serialized.errorCode,
      errorType: serialized.body.error.type,
    })

    ctx.response.status(serialized.status).send(serialized.body)
  }

  async report(error: unknown, ctx: HttpContext) {
    if (
      error instanceof ApiError &&
      error.visibility === 'user_facing' &&
      (error.status ?? 0) < 500
    ) {
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

  private serializeError(
    error: unknown,
    ctx: HttpContext
  ): {
    status: number
    errorCode: ErrorCode
    body: ReturnType<typeof buildStructuredErrorResponse>
  } {
    if (error instanceof ApiError) {
      return {
        status: error.status,
        errorCode: error.errorCode,
        body: buildStructuredErrorResponse(ctx, {
          errorCode: error.errorCode,
          message: error.message,
          details: error.details,
          errorType: error.errorType,
          visibility: error.visibility,
        }),
      }
    }

    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      return {
        status: 422,
        errorCode: 'validation_failed',
        body: buildStructuredErrorResponse(ctx, {
          errorCode: 'validation_failed',
          message: 'Request validation failed',
          details: { errors: error.messages },
        }),
      }
    }

    if (error instanceof authErrors.E_UNAUTHORIZED_ACCESS) {
      return {
        status: 401,
        errorCode: 'account_session_invalid',
        body: buildStructuredErrorResponse(ctx, {
          errorCode: 'account_session_invalid',
          message: 'Invalid authorization',
        }),
      }
    }

    if (error instanceof authErrors.E_INVALID_CREDENTIALS) {
      return {
        status: 401,
        errorCode: 'account_credentials_invalid',
        body: buildStructuredErrorResponse(ctx, {
          errorCode: 'account_credentials_invalid',
          message: 'Invalid email or password',
        }),
      }
    }

    if (this.isObjectWithStatus(error)) {
      const status = typeof error.status === 'number' ? error.status : 500
      const message = typeof error.message === 'string' ? error.message : undefined
      const code = typeof error.code === 'string' ? error.code : ''

      if (status === 429 || code === 'E_TOO_MANY_REQUESTS') {
        return {
          status: 429,
          errorCode: 'rate_limit_exceeded',
          body: buildStructuredErrorResponse(ctx, {
            errorCode: 'rate_limit_exceeded',
            message: message || 'Too many requests, please slow down',
          }),
        }
      }

      if (status === 404) {
        return {
          status: 404,
          errorCode: 'resource_not_found',
          body: buildStructuredErrorResponse(ctx, {
            errorCode: 'resource_not_found',
            message: message || 'Resource not found',
          }),
        }
      }

      if (status === 403) {
        return {
          status: 403,
          errorCode: 'permission_denied',
          body: buildStructuredErrorResponse(ctx, {
            errorCode: 'permission_denied',
            message: message || "You don't have permission",
          }),
        }
      }

      if (status === 400) {
        return {
          status: 400,
          errorCode: 'invalid_request',
          body: buildStructuredErrorResponse(ctx, {
            errorCode: 'invalid_request',
            message: message || 'Invalid request',
          }),
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
        : {
            name: error.name,
            stack: error.stack?.split('\n').slice(0, 10),
          }

    return {
      status: 500,
      errorCode: 'internal_error',
      body: buildStructuredErrorResponse(ctx, {
        errorCode: 'internal_error',
        message,
        details,
      }),
    }
  }

  private isObjectWithStatus(value: unknown): value is {
    status?: number
    code?: string
    message?: string
  } {
    return typeof value === 'object' && value !== null
  }
}
