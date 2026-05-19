import type { HttpContext } from '@adonisjs/core/http'

type Response = HttpContext['response']

export interface PaginationMeta {
  has_more: boolean
  next_cursor: string | null
  limit: number
}

export interface ErrorDetail {
  field?: string
  code?: string
  message?: string
  [key: string]: unknown
}

export interface ApiError {
  code: string
  message: string
  request_id?: string
  doc_url?: string
  details?: ErrorDetail[] | Record<string, unknown>
}

export const DOC_BASE_URL = 'https://developers.fakturapp.cc/concepts/errors'

class ApiResponseService {
  ok<T>(response: Response, data: T) {
    return response.ok({ data })
  }

  created<T>(response: Response, data: T) {
    return response.created({ data })
  }

  list<T>(response: Response, data: T[], pagination: PaginationMeta) {
    return response.ok({ data, pagination })
  }

  noContent(response: Response) {
    return response.noContent()
  }

  error(
    response: Response,
    status: number,
    error: Omit<ApiError, 'doc_url'> & { doc_url?: string }
  ) {
    const enriched: ApiError = {
      ...error,
      doc_url: error.doc_url ?? `${DOC_BASE_URL}#${error.code}`,
    }
    return response.status(status).send({ error: enriched })
  }

  badRequest(response: Response, error: Omit<ApiError, 'doc_url'>) {
    return this.error(response, 400, error)
  }

  unauthorized(response: Response, code: string, message: string, requestId?: string) {
    return this.error(response, 401, { code, message, request_id: requestId })
  }

  forbidden(response: Response, code: string, message: string, requestId?: string) {
    return this.error(response, 403, { code, message, request_id: requestId })
  }

  notFound(response: Response, code: string, message: string, requestId?: string) {
    return this.error(response, 404, { code, message, request_id: requestId })
  }

  conflict(response: Response, code: string, message: string, requestId?: string) {
    return this.error(response, 409, { code, message, request_id: requestId })
  }

  unprocessable(
    response: Response,
    code: string,
    message: string,
    details?: ErrorDetail[],
    requestId?: string
  ) {
    return this.error(response, 422, { code, message, details, request_id: requestId })
  }

  rateLimited(
    response: Response,
    retryAfterSeconds: number,
    details: Record<string, unknown>,
    requestId?: string
  ) {
    response.header('Retry-After', String(retryAfterSeconds))
    return this.error(response, 429, {
      code: 'rate_limited',
      message: `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
      details,
      request_id: requestId,
    })
  }

  internal(response: Response, requestId: string) {
    return this.error(response, 500, {
      code: 'internal_error',
      message: 'Internal server error',
      request_id: requestId,
    })
  }
}

export default new ApiResponseService()
