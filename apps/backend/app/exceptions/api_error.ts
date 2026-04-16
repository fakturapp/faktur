import { Exception } from '@adonisjs/core/exceptions'
import { ERROR_CODES, type ErrorCode, type ErrorType, type ErrorVisibility } from './error_codes.js'

export class ApiError extends Exception {
  readonly errorCode: ErrorCode
  readonly errorType: ErrorType
  readonly visibility: ErrorVisibility
  readonly details: Record<string, unknown> | null

  constructor(
    code: ErrorCode,
    options: {
      message?: string
      details?: Record<string, unknown> | null
      cause?: unknown
    } = {}
  ) {
    const def = ERROR_CODES[code]
    super(options.message ?? def.defaultMessage, {
      status: def.status,
      code: code.toUpperCase(),
    })
    this.errorCode = code
    this.errorType = def.type
    this.visibility = def.visibility
    this.details = options.details ?? null
    if (options.cause !== undefined) {
      ;(this as Error).cause = options.cause as Error
    }
  }

  static throw(code: ErrorCode, options?: ConstructorParameters<typeof ApiError>[1]): never {
    throw new ApiError(code, options)
  }
}
