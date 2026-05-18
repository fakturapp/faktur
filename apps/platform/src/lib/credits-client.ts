import { api } from '@/lib/api'

export interface CreditsUsage {
  session: {
    used: number
    limit: number
    remaining: number
    started_at: string | null
    reset_at: string | null
    hours_window: number
    active: boolean
  }
  weekly: { used: number; limit: number; remaining: number; reset_at: string }
  per_minute: { limit: number }
}

const BASE = '/dashboard/settings'

export const creditsClient = {
  usage: () => api.get<{ data: CreditsUsage }>(`${BASE}/credits/usage`),
}
