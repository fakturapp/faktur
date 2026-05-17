import { API_BASE_URL } from './oauth-config'
import { getStoredAccessToken, clearTokens } from './oauth-storage'

function resolveApiUrl(endpoint: string) {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${API_BASE_URL}${path}`
}

let unauthorizedListeners: Array<() => void> = []

export function onUnauthorized(cb: () => void) {
  unauthorizedListeners.push(cb)
  return () => {
    unauthorizedListeners = unauthorizedListeners.filter((l) => l !== cb)
  }
}

function notifyUnauthorized() {
  unauthorizedListeners.forEach((cb) => {
    try {
      cb()
    } catch {
      /* ignore */
    }
  })
}

function parseErrorPayload(data: any): { code?: string; message: string } {
  const details = data?.error?.details
  const validationErrors = Array.isArray(details?.errors)
    ? details.errors
    : Array.isArray(data?.errors)
      ? data.errors
      : null
  const firstValidationMessage =
    validationErrors && typeof validationErrors[0]?.message === 'string'
      ? validationErrors[0].message
      : undefined

  return {
    code:
      (typeof data?.error?.code === 'string' ? data.error.code : undefined) ||
      (typeof data?.error?.error_code === 'string' ? data.error.error_code : undefined) ||
      (typeof details?.error_code === 'string' ? details.error_code : undefined) ||
      (typeof data?.code === 'string' ? data.code : undefined),
    message:
      (typeof data?.error?.message === 'string' ? data.error.message : undefined) ||
      (typeof data?.message === 'string' ? data.message : undefined) ||
      firstValidationMessage ||
      'Something went wrong',
  }
}

async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; errorCode?: string }> {
  const token = getStoredAccessToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await fetch(resolveApiUrl(endpoint), { ...options, headers })

    if (res.status === 401) {
      const data = await res.json().catch(() => ({}))
      clearTokens()
      notifyUnauthorized()
      const parsed = parseErrorPayload(data)
      return { error: parsed.message || 'Session expirée', errorCode: parsed.code }
    }

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      const parsed = parseErrorPayload(data ?? {})
      return { error: parsed.message, errorCode: parsed.code }
    }

    return { data: (data as T) ?? (undefined as T) }
  } catch {
    return { error: 'Erreur réseau. Réessaye.' }
  }
}

export const api = {
  get: <T = unknown>(endpoint: string, opts?: { headers?: Record<string, string> }) =>
    request<T>(endpoint, { method: 'GET', headers: opts?.headers }),
  post: <T = unknown>(
    endpoint: string,
    body: unknown,
    opts?: { headers?: Record<string, string> }
  ) =>
    request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: opts?.headers,
    }),
  put: <T = unknown>(
    endpoint: string,
    body: unknown,
    opts?: { headers?: Record<string, string> }
  ) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: opts?.headers,
    }),
  patch: <T = unknown>(
    endpoint: string,
    body: unknown,
    opts?: { headers?: Record<string, string> }
  ) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: opts?.headers,
    }),
  delete: <T = unknown>(
    endpoint: string,
    body?: unknown,
    opts?: { headers?: Record<string, string> }
  ) =>
    request<T>(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
      headers: opts?.headers,
    }),
}

export type ApiResult<T> = { data?: T; error?: string; errorCode?: string }
