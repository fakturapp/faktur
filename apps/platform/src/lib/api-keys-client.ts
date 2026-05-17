import { api } from '@/lib/api'

export interface ApiKeyShape {
  id: string
  project_id: string
  name: string
  prefix: string
  masked_token: string
  scopes: string[]
  rate_limit_tier: 'default' | 'pro' | 'business' | 'unlimited'
  allowed_ips: string[] | null
  expires_at: string | null
  last_used_at: string | null
  last_ip: string | null
  usage_count: number
  status: 'active' | 'expired' | 'revoked' | 'rotating'
  revoked_at: string | null
  revoked_reason: string | null
  rotation_grace_until: string | null
  created_at: string
  updated_at: string | null
}

export interface WebhookShape {
  id: string
  url: string
  masked_secret: string
  events: string[]
  is_active: boolean
  last_delivery_at: string | null
  last_delivery_status: string | null
  consecutive_failures: number
}

export interface DeliveryShape {
  id: string
  event_type: string
  event_id: string
  url: string
  status: 'pending' | 'in_flight' | 'delivered' | 'failed' | 'failed_permanent'
  attempt_count: number
  last_status_code: number | null
  last_error: string | null
  delivered_at: string | null
  next_attempt_at: string | null
  created_at: string
}

export interface RequestLogShape {
  id: number
  method: string
  path: string
  status: number
  latency_ms: number
  ip: string
  request_id: string
  error_code: string | null
  created_at: string
}

export interface UsageStats {
  daily: Array<{ day: string; count: number }>
  top_endpoints: Array<{ endpoint: string; count: number }>
  status_distribution: Array<{ bucket: string; count: number }>
  total_this_month: number
  usage_count_lifetime: number
}

export interface ScopesCatalog {
  resources: Array<{ name: string; actions: string[]; scopes: string[] }>
  all_scopes: string[]
  webhook_events: string[]
  webhook_event_categories: Record<string, string[]>
  presets: {
    read_only: string[]
    read_write: string[]
    full_access: string[]
  }
}

const BASE = '/dashboard/settings/api-keys'

export const apiKeysClient = {
  list: () => api.get<{ data: ApiKeyShape[] }>(BASE),
  show: (id: string) =>
    api.get<{ data: ApiKeyShape; webhook: WebhookShape | null }>(`${BASE}/${id}`),
  catalog: () => api.get<{ data: ScopesCatalog }>(`${BASE}/scopes-catalog`),
  create: (body: {
    project_id: string
    name: string
    scopes: string[]
    expires_at?: string
    allowed_ips?: string[]
    rate_limit_tier?: string
  }) => api.post<{ data: ApiKeyShape; plaintext: string; message: string }>(BASE, body),
  update: (id: string, body: { name?: string; scopes?: string[]; allowed_ips?: string[] | null }) =>
    api.patch<{ data: ApiKeyShape }>(`${BASE}/${id}`, body),
  rotate: (id: string) =>
    api.post<{ data: ApiKeyShape; plaintext: string; grace_until: string | null; message: string }>(
      `${BASE}/${id}/rotate`,
      {}
    ),
  revoke: (id: string) => api.delete<{ message: string }>(`${BASE}/${id}`),
  setWebhook: (id: string, body: { url: string; events: string[] }) =>
    api.put<{
      data: WebhookShape
      plaintext_secret: string | null
      message: string
    }>(`${BASE}/${id}/webhook`, body),
  destroyWebhook: (id: string) => api.delete<{ message: string }>(`${BASE}/${id}/webhook`),
  rotateWebhookSecret: (id: string) =>
    api.post<{ plaintext_secret: string; masked_secret: string; message: string }>(
      `${BASE}/${id}/webhook/rotate-secret`,
      {}
    ),
  testWebhook: (id: string, eventType?: string) =>
    api.post<{
      delivered: boolean
      status_code: number | null
      error: string | null
      latency_ms: number
      event_type: string
      delivery_id: string
    }>(`${BASE}/${id}/webhook/test`, { event_type: eventType }),
  deliveries: (id: string, params?: { status?: string; event_type?: string; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params?.status) qs.set('status', params.status)
    if (params?.event_type) qs.set('event_type', params.event_type)
    if (params?.limit) qs.set('limit', String(params.limit))
    const suffix = qs.toString() ? `?${qs}` : ''
    return api.get<{ data: DeliveryShape[] }>(`${BASE}/${id}/deliveries${suffix}`)
  },
  retryDelivery: (id: string, deliveryId: string) =>
    api.post<{
      delivered: boolean
      status_code: number | null
      error: string | null
      latency_ms: number
    }>(`${BASE}/${id}/deliveries/${deliveryId}/retry`, {}),
  logs: (id: string, params?: { status_bucket?: '2xx' | '4xx' | '5xx'; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params?.status_bucket) qs.set('status_bucket', params.status_bucket)
    if (params?.limit) qs.set('limit', String(params.limit))
    const suffix = qs.toString() ? `?${qs}` : ''
    return api.get<{ data: RequestLogShape[] }>(`${BASE}/${id}/logs${suffix}`)
  },
  usageStats: (id: string) => api.get<{ data: UsageStats }>(`${BASE}/${id}/usage-stats`),
}
