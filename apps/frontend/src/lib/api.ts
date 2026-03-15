const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('faktur_token') : null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers })
    const data = await res.json()

    if (!res.ok) {
      return { error: data.message || 'Something went wrong' }
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

  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    })
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

  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, { method: 'GET', headers })

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

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

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
  post: <T = unknown>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  get: <T = unknown>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  put: <T = unknown>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T = unknown>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T = unknown>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
  upload: <T = unknown>(endpoint: string, formData: FormData) =>
    uploadRequest<T>(endpoint, formData),
  downloadBlob: (endpoint: string) => blobRequest(endpoint),
  postBlob: (endpoint: string, body: unknown) => postBlobRequest(endpoint, body),
}
