import { tutorialIntercept } from './tutorial-sandbox'
import { captureApiError } from './dev-mode'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || ''

function resolveApiUrl(endpoint: string) {
  return `${API_URL}${API_PREFIX}${endpoint}`
}

function recordApiError(method: string, endpoint: string, status: number, body: unknown) {
  captureApiError({
    url: resolveApiUrl(endpoint),
    method,
    status,
    body,
    ts: Date.now(),
  })
}

let vaultLockListeners: (() => void)[] = []
export function onVaultLocked(cb: () => void) {
  vaultLockListeners.push(cb)
  return () => { vaultLockListeners = vaultLockListeners.filter((l) => l !== cb) }
}
function notifyVaultLocked() {
  vaultLockListeners.forEach((cb) => cb())
}

function parseErrorPayload(data: any): { code?: string; message: string } {
  const details = data?.error?.details
  const validationErrors = Array.isArray(details?.errors) ? details.errors : Array.isArray(data?.errors) ? data.errors : null
  const firstValidationMessage =
    validationErrors && typeof validationErrors[0]?.message === 'string'
      ? validationErrors[0].message
      : undefined

  return {
    code:
      (typeof details?.error_code === 'string' ? details.error_code : undefined) ||
      (typeof data?.error?.error_code === 'string' ? data.error.error_code : undefined) ||
      (typeof data?.code === 'string' ? data.code : undefined),
    message:
      (typeof data?.error?.message === 'string' ? data.error.message : undefined) ||
      (typeof data?.message === 'string' ? data.message : undefined) ||
      firstValidationMessage ||
      'Something went wrong',
  }
}

function handleVaultOrSession(data: any, status: number): { error: string } | null {
  const { code, message } = parseErrorPayload(data)

  if (status === 423 && (code === 'VAULT_LOCKED' || code === 'vault_locked')) {
    notifyVaultLocked()
    return { error: 'VAULT_LOCKED' }
  }

  if (
    status === 401 &&
    (code === 'SESSION_EXPIRED' || code === 'account_session_invalid' || code === 'account_session_expired')
  ) {
    localStorage.removeItem('faktur_token')
    localStorage.removeItem('faktur_vault_key')
    window.location.href = '/login'
    return { error: message || 'Session expired' }
  }

  return null
}

async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; errorCode?: string }> {
  const sandboxed = tutorialIntercept<T>(endpoint, options)
  if (sandboxed) return sandboxed

  const token = typeof window !== 'undefined' ? localStorage.getItem('faktur_token') : null
  const vaultKey = typeof window !== 'undefined' ? localStorage.getItem('faktur_vault_key') : null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (vaultKey) {
    headers['X-Vault-Key'] = vaultKey
  }

  try {
    const res = await fetch(resolveApiUrl(endpoint), { ...options, headers })

    if (res.status === 423 || res.status === 401) {
      const data = await res.json().catch(() => ({}))
      recordApiError(options.method || 'GET', endpoint, res.status, data)
      const handled = handleVaultOrSession(data, res.status)
      if (handled) return handled
      const parsed = parseErrorPayload(data)
      return { error: parsed.message || 'Unauthorized', errorCode: parsed.code }
    }

    const data = await res.json()

    if (!res.ok) {
      recordApiError(options.method || 'GET', endpoint, res.status, data)
      const parsed = parseErrorPayload(data)
      return { error: parsed.message, errorCode: parsed.code }
    }
    return { data }
  } catch (err) {
    recordApiError(options.method || 'GET', endpoint, 0, { networkError: String(err) })
    return { error: 'Network error. Please try again.' }
  }
}

async function uploadRequest<T = unknown>(
  endpoint: string,
  formData: FormData
): Promise<{ data?: T; error?: string }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('faktur_token') : null
  const vaultKey = typeof window !== 'undefined' ? localStorage.getItem('faktur_vault_key') : null

  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (vaultKey) {
    headers['X-Vault-Key'] = vaultKey
  }

  try {
    const res = await fetch(resolveApiUrl(endpoint), {
      method: 'POST',
      headers,
      body: formData,
    })

    if (res.status === 423 || res.status === 401) {
      const data = await res.json().catch(() => ({}))
      recordApiError('POST', endpoint, res.status, data)
      const handled = handleVaultOrSession(data, res.status)
      if (handled) return handled
      return { error: parseErrorPayload(data).message || 'Unauthorized' }
    }

    const data = await res.json()

    if (!res.ok) {
      recordApiError('POST', endpoint, res.status, data)
      return { error: parseErrorPayload(data).message }
    }
    return { data }
  } catch (err) {
    recordApiError('POST', endpoint, 0, { networkError: String(err) })
    return { error: 'Network error. Please try again.' }
  }
}

async function blobRequest(endpoint: string): Promise<{ blob?: Blob; filename?: string; error?: string }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('faktur_token') : null
  const vaultKey = typeof window !== 'undefined' ? localStorage.getItem('faktur_vault_key') : null

  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (vaultKey) {
    headers['X-Vault-Key'] = vaultKey
  }

  try {
    const res = await fetch(resolveApiUrl(endpoint), { method: 'GET', headers })

    if (res.status === 423 || res.status === 401) {
      const data = await res.json().catch(() => ({}))
      const handled = handleVaultOrSession(data, res.status)
      if (handled) return handled
      return { error: parseErrorPayload(data).message || 'Unauthorized' }
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: 'Download failed' }))
      return { error: parseErrorPayload(data).message || 'Download failed' }
    }

    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition') || ''
    const match = disposition.match(/filename="?([^"]+)"?/)
    const filename = match?.[1] || 'download'
    return { blob, filename }
  } catch {
    return { error: 'Network error. Please try again.' }
  }
}

async function postBlobRequest(
  endpoint: string,
  body: unknown
): Promise<{ blob?: Blob; filename?: string; error?: string }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('faktur_token') : null
  const vaultKey = typeof window !== 'undefined' ? localStorage.getItem('faktur_vault_key') : null

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (vaultKey) {
    headers['X-Vault-Key'] = vaultKey
  }

  try {
    const res = await fetch(resolveApiUrl(endpoint), {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (res.status === 423 || res.status === 401) {
      const data = await res.json().catch(() => ({}))
      const handled = handleVaultOrSession(data, res.status)
      if (handled) return handled
      return { error: parseErrorPayload(data).message || 'Unauthorized' }
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: 'Download failed' }))
      return { error: parseErrorPayload(data).message || 'Download failed' }
    }

    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition') || ''
    const match = disposition.match(/filename="?([^"]+)"?/)
    const filename = match?.[1] || 'download'
    return { blob, filename }
  } catch {
    return { error: 'Network error. Please try again.' }
  }
}

export const api = {
  post: <T = unknown>(endpoint: string, body: unknown, opts?: { headers?: Record<string, string> }) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body), headers: opts?.headers }),
  get: <T = unknown>(endpoint: string, opts?: { headers?: Record<string, string> }) =>
    request<T>(endpoint, { method: 'GET', headers: opts?.headers }),
  put: <T = unknown>(endpoint: string, body: unknown, opts?: { headers?: Record<string, string> }) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body), headers: opts?.headers }),
  patch: <T = unknown>(endpoint: string, body: unknown, opts?: { headers?: Record<string, string> }) =>
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body), headers: opts?.headers }),
  delete: <T = unknown>(endpoint: string, body?: unknown, opts?: { headers?: Record<string, string> }) =>
    request<T>(endpoint, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined, headers: opts?.headers }),
  upload: <T = unknown>(endpoint: string, formData: FormData) =>
    uploadRequest<T>(endpoint, formData),
  downloadBlob: (endpoint: string) => blobRequest(endpoint),
  postBlob: (endpoint: string, body: unknown) => postBlobRequest(endpoint, body),
}

async function publicRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  try {
    const res = await fetch(resolveApiUrl(endpoint), { ...options, headers })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return {
        error: parseErrorPayload(data).message,
        status: res.status,
      }
    }

    return {
      data,
      status: res.status,
    }
  } catch {
    return {
      error: 'Network error. Please try again.',
      status: 0,
    }
  }
}

async function publicBlobRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ blob?: Blob; filename?: string; error?: string; status: number }> {
  try {
    const res = await fetch(resolveApiUrl(endpoint), options)

    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: 'Download failed' }))
      return {
        error: parseErrorPayload(data).message || 'Download failed',
        status: res.status,
      }
    }

    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition') || ''
    const match = disposition.match(/filename="?([^"]+)"?/)
    const filename = match?.[1] || 'download'

    return {
      blob,
      filename,
      status: res.status,
    }
  } catch {
    return {
      error: 'Network error. Please try again.',
      status: 0,
    }
  }
}

export const publicApi = {
  get: <T = unknown>(endpoint: string, opts?: { headers?: Record<string, string> }) =>
    publicRequest<T>(endpoint, { method: 'GET', headers: opts?.headers }),
  post: <T = unknown>(endpoint: string, body?: unknown, opts?: { headers?: Record<string, string> }) =>
    publicRequest<T>(endpoint, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: opts?.headers,
    }),
  downloadBlob: (endpoint: string, opts?: { headers?: Record<string, string> }) =>
    publicBlobRequest(endpoint, { method: 'GET', headers: opts?.headers }),
}
