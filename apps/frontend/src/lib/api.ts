const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

// Global vault lock event — listened by VaultUnlockModal
let vaultLockListeners: (() => void)[] = []
export function onVaultLocked(cb: () => void) {
  vaultLockListeners.push(cb)
  return () => { vaultLockListeners = vaultLockListeners.filter((l) => l !== cb) }
}
function notifyVaultLocked() {
  vaultLockListeners.forEach((cb) => cb())
}

function handleVaultOrSession(data: any, status: number): { error: string } | null {
  if (status === 423 && data.code === 'VAULT_LOCKED') {
    notifyVaultLocked()
    return { error: 'VAULT_LOCKED' }
  }
  if (status === 401 && data.code === 'SESSION_EXPIRED') {
    localStorage.removeItem('faktur_token')
    localStorage.removeItem('faktur_vault_key')
    window.location.href = '/login'
    return { error: 'Session expired' }
  }
  return null
}

async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; code?: string }> {
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
    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers })

    if (res.status === 423 || res.status === 401) {
      const data = await res.json().catch(() => ({}))
      const handled = handleVaultOrSession(data, res.status)
      if (handled) return handled
      return { error: data.message || 'Unauthorized' }
    }

    const data = await res.json()

    if (!res.ok) {
      const message =
        data.message ||
        (Array.isArray(data.errors) && data.errors[0]?.message) ||
        'Something went wrong'
      return { error: message, code: data.code }
    }
    return { data }
  } catch {
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
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (res.status === 423 || res.status === 401) {
      const data = await res.json().catch(() => ({}))
      const handled = handleVaultOrSession(data, res.status)
      if (handled) return handled
      return { error: data.message || 'Unauthorized' }
    }

    const data = await res.json()

    if (!res.ok) {
      return { error: data.message || 'Something went wrong' }
    }
    return { data }
  } catch {
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
    const res = await fetch(`${API_URL}${endpoint}`, { method: 'GET', headers })

    if (res.status === 423 || res.status === 401) {
      const data = await res.json().catch(() => ({}))
      const handled = handleVaultOrSession(data, res.status)
      if (handled) return handled
      return { error: data.message || 'Unauthorized' }
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: 'Download failed' }))
      return { error: data.message || 'Download failed' }
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
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (res.status === 423 || res.status === 401) {
      const data = await res.json().catch(() => ({}))
      const handled = handleVaultOrSession(data, res.status)
      if (handled) return handled
      return { error: data.message || 'Unauthorized' }
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: 'Download failed' }))
      return { error: data.message || 'Download failed' }
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
