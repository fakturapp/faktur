import { tutorialIntercept } from './tutorial-sandbox'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

let vaultLockListeners: (() => void)[] = []
export function onVaultLocked(cb: () => void) {
  vaultLockListeners.push(cb)
  return () => {
    vaultLockListeners = vaultLockListeners.filter((l) => l !== cb)
  }
}
function notifyVaultLocked() {
  vaultLockListeners.forEach((cb) => cb())
}

function clearClientSessionHints() {
  try {
    localStorage.removeItem('faktur_vault_locked')
  } catch {
    // Ignore storage failures
  }
}

function isPublicClientPath(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/legal') ||
    pathname.startsWith('/share') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/oauth')
  )
}

function extractApiMessage(data: any): string {
  return (
    data?.message ||
    data?.error?.message ||
    (Array.isArray(data?.errors) && data.errors[0]?.message) ||
    (Array.isArray(data?.error?.details?.errors) && data.error.details.errors[0]?.message) ||
    'Something went wrong'
  )
}

function handleVaultOrSession(data: any, status: number): { error: string } | null {
  const errorCode = data?.code || data?.error?.error_code

  if (status === 423 && errorCode === 'vault_locked') {
    notifyVaultLocked()
    return { error: 'VAULT_LOCKED' }
  }

  if (
    status === 401 &&
    (errorCode === 'SESSION_EXPIRED' ||
      errorCode === 'account_session_invalid' ||
      errorCode === 'account_session_expired')
  ) {
    clearClientSessionHints()
    if (!isPublicClientPath(window.location.pathname)) {
      window.location.href = '/login'
    }
    return { error: 'Session expired' }
  }

  return null
}

async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  const sandboxed = tutorialIntercept<T>(endpoint, options)
  if (sandboxed) return sandboxed

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers,
    })

    if (res.status === 423 || res.status === 401) {
      const data = await res.json().catch(() => ({}))
      const handled = handleVaultOrSession(data, res.status)
      if (handled) return handled
      return { error: extractApiMessage(data) }
    }

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return { error: extractApiMessage(data) }
    }
    return { data: data as T }
  } catch {
    return { error: 'Network error. Please try again.' }
  }
}

async function uploadRequest<T = unknown>(
  endpoint: string,
  formData: FormData
): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })

    if (res.status === 423 || res.status === 401) {
      const data = await res.json().catch(() => ({}))
      const handled = handleVaultOrSession(data, res.status)
      if (handled) return handled
      return { error: extractApiMessage(data) }
    }

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return { error: extractApiMessage(data) }
    }
    return { data: data as T }
  } catch {
    return { error: 'Network error. Please try again.' }
  }
}

async function blobRequest(
  endpoint: string,
  options: RequestInit = { method: 'GET' }
): Promise<{ blob?: Blob; filename?: string; error?: string }> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
    })

    if (res.status === 423 || res.status === 401) {
      const data = await res.json().catch(() => ({}))
      const handled = handleVaultOrSession(data, res.status)
      if (handled) return handled
      return { error: extractApiMessage(data) }
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: 'Download failed' }))
      return { error: extractApiMessage(data) }
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
    request<T>(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
      headers: opts?.headers,
    }),
  upload: <T = unknown>(endpoint: string, formData: FormData) => uploadRequest<T>(endpoint, formData),
  downloadBlob: (endpoint: string) => blobRequest(endpoint),
  postBlob: (endpoint: string, body: unknown) =>
    blobRequest(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
}
