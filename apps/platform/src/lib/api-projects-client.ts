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
  destroy: (id: string) => api.delete<{ message: string }>(`${BASE}/${id}`),
}
