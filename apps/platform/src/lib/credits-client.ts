import { api } from '@/lib/api'

export interface CreditsUsage {
  daily: { used: number; limit: number; remaining: number; reset_at: string }
  weekly: { used: number; limit: number; remaining: number; reset_at: string }
  per_minute: { limit: number }
}

const BASE = '/dashboard/settings'

export const creditsClient = {
  usage: () => api.get<{ data: CreditsUsage }>(`${BASE}/credits/usage`),
}
