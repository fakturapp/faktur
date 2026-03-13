const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('zenvoice_token') : null

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

export const api = {
  post: <T = unknown>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  get: <T = unknown>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
}
