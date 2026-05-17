import type { HttpContext } from '@adonisjs/core/http'
import {
  ERROR_CODES,
  type ErrorCode,
  type ErrorDefinition,
  type ErrorVisibility,
  isErrorCode,
} from '#exceptions/error_codes'
import { getRequestId } from '#middleware/core/request_id_middleware'

type PlainObject = Record<string, unknown>

export interface StructuredErrorResponse {
  type: 'error'
  error: {
    type: string
    message: string
    details: Record<string, unknown>
  }
  request_id: string | null
}

interface BuildStructuredErrorOptions {
  errorCode: ErrorCode
  message?: string
  details?: PlainObject | null
  errorType?: string
  visibility?: ErrorVisibility
}

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getDefinition(code: ErrorCode): ErrorDefinition {
  return ERROR_CODES[code]
}

function extractMessage(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value
  if (!isPlainObject(value)) return undefined
  if (typeof value.message === 'string' && value.message.trim()) return value.message
  if (Array.isArray(value.errors)) {
    const firstError = value.errors[0]
    if (
      isPlainObject(firstError) &&
      typeof firstError.message === 'string' &&
      firstError.message.trim()
    ) {
      return firstError.message
    }
  }
  return undefined
}

function inferErrorCode(status: number): ErrorCode {
  switch (status) {
    case 401:
      return 'account_credentials_invalid'
    case 403:
      return 'permission_denied'
    case 404:
      return 'resource_not_found'
    case 409:
      return 'resource_conflict'
    case 422:
      return 'validation_failed'
    case 423:
      return 'vault_locked'
    case 429:
      return 'rate_limit_exceeded'
    case 503:
      return 'service_unavailable'
    case 400:
    default:
      return status >= 500 ? 'internal_error' : 'invalid_request'
  }
}

function extractExplicitErrorCode(value: unknown): ErrorCode | null {
  if (!isPlainObject(value)) return null

  const directCode = typeof value.code === 'string' ? value.code : null
  if (directCode && isErrorCode(directCode)) return directCode

  if (isPlainObject(value.error)) {
    const nestedCode =
      isPlainObject(value.error.details) && typeof value.error.details.error_code === 'string'
        ? value.error.details.error_code
        : typeof value.error.error_code === 'string'
          ? value.error.error_code
          : null

    if (nestedCode && isErrorCode(nestedCode)) return nestedCode
  }

  return null
}

function extractDetails(value: unknown): PlainObject | null {
  if (!isPlainObject(value)) return null

  const details: PlainObject = {}
  const nestedDetails = isPlainObject(value.details) ? value.details : null

  if (nestedDetails) {
    for (const [key, nestedValue] of Object.entries(nestedDetails)) {
      if (key === 'error_visibility' || key === 'error_code') continue
      details[key] = nestedValue
    }
  }

  for (const [key, entryValue] of Object.entries(value)) {
    if (['message', 'error', 'code', 'type', 'request_id', 'details'].includes(key)) continue
    details[key] = entryValue
  }

  return Object.keys(details).length > 0 ? details : null
}

function normalizeStructuredBody(ctx: HttpContext, value: PlainObject): StructuredErrorResponse {
  const errorBody = isPlainObject(value.error) ? value.error : {}
  const explicitCode =
    extractExplicitErrorCode(value) ??
    inferErrorCode(typeof value.status === 'number' ? value.status : 500)
  const errorDetails = isPlainObject(errorBody.details) ? errorBody.details : {}
  const visibility =
    typeof errorDetails.error_visibility === 'string'
      ? (errorDetails.error_visibility as ErrorVisibility)
      : undefined

  return buildStructuredErrorResponse(ctx, {
    errorCode: explicitCode,
    message: extractMessage(errorBody) ?? extractMessage(value),
    details: extractDetails(errorBody) ?? extractDetails(value),
    errorType: typeof errorBody.type === 'string' ? errorBody.type : undefined,
    visibility,
  })
}

export function buildStructuredErrorResponse(
  ctx: HttpContext,
  options: BuildStructuredErrorOptions
): StructuredErrorResponse {
  const definition = getDefinition(options.errorCode)

  return {
    type: 'error',
    error: {
      type: options.errorType ?? definition.type,
      message: options.message ?? definition.defaultMessage,
      details: {
        error_visibility: options.visibility ?? definition.visibility,
        error_code: options.errorCode,
        ...(options.details ?? {}),
      },
    },
    request_id: getRequestId(ctx) ?? null,
  }
}

export function normalizeManualErrorResponse(
  ctx: HttpContext,
  status: number,
  payload: unknown
): StructuredErrorResponse {
  if (isPlainObject(payload) && payload.type === 'error' && isPlainObject(payload.error)) {
    return normalizeStructuredBody(ctx, payload)
  }

  const explicitCode = extractExplicitErrorCode(payload)
  const errorCode = explicitCode ?? inferErrorCode(status)
  const definition = getDefinition(errorCode)

  return buildStructuredErrorResponse(ctx, {
    errorCode,
    message: extractMessage(payload) ?? definition.defaultMessage,
    details: extractDetails(payload),
  })
}
