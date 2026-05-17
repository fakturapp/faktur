import { api } from '@/lib/api'

export interface ApiProjectShape {
  id: string
  name: string
  description: string | null
  color: string | null
  is_default: boolean
  is_archived: boolean
  keys_count?: number
  created_at: string
  updated_at: string | null
}

const BASE = '/dashboard/settings/api-projects'

export const apiProjectsClient = {
  list: () => api.get<{ data: ApiProjectShape[] }>(BASE),
  show: (id: string) => api.get<{ data: ApiProjectShape }>(`${BASE}/${id}`),
  create: (body: { name: string; description?: string | null; color?: string | null }) =>
    api.post<{ data: ApiProjectShape }>(BASE, body),
  update: (
    id: string,
    body: {
      name?: string
      description?: string | null
      color?: string | null
      is_archived?: boolean
    }
  ) => api.patch<{ data: ApiProjectShape }>(`${BASE}/${id}`, body),
  destroy: (id: string, password?: string) =>
    api.delete<{ message: string }>(`${BASE}/${id}`, password ? { password } : undefined),
  auditLogs: (id: string, params?: { limit?: number }) => {
    const qs = new URLSearchParams()
    if (params?.limit) qs.set('limit', String(params.limit))
    const suffix = qs.toString() ? `?${qs}` : ''
    return api.get<{ data: AuditLogShape[] }>(`${BASE}/${id}/audit-logs${suffix}`)
  },
  logExplorerCall: (
    id: string,
    body: {
      method: string
      path: string
      query?: string | null
      status: number
      latency_ms: number
      response_size_bytes?: number
      api_key_id?: string | null
      error?: string | null
    }
  ) => api.post<{ message: string }>(`${BASE}/${id}/explorer-events`, body),
}

export interface AuditLogShape {
  id: number
  action: string
  target_type: string
  target_id: string | null
  target_label: string | null
  actor: {
    user_id: string | null
    name: string | null
    email: string | null
  }
  ip: string | null
  user_agent: string | null
  metadata: Record<string, unknown>
  created_at: string
}
