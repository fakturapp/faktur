import db from '@adonisjs/lucid/services/db'

export interface RateLimitTier {
  perMinute: number
  perHour: number
}

export const RATE_LIMIT_TIERS: Record<string, RateLimitTier> = {
  default: { perMinute: 60, perHour: 1000 },
  pro: { perMinute: 120, perHour: 5000 },
  business: { perMinute: 300, perHour: 20000 },
  unlimited: { perMinute: 1000, perHour: 100000 },
}

export function tierFor(name: string | null | undefined): RateLimitTier {
  return RATE_LIMIT_TIERS[name ?? 'default'] ?? RATE_LIMIT_TIERS.default
}

export interface ConsumeOutcome {
  allowed: boolean
  remaining: number
  limit: number
  resetSeconds: number
  window: '1m' | '1h'
}

const MINUTE_SECONDS = 60
const HOUR_SECONDS = 3600

const memoryStore: Map<string, { count: number; resetAt: number }> = new Map()

class ApiRateLimiter {
  async consume(apiKeyId: string, tierName: string): Promise<ConsumeOutcome> {
    const tier = tierFor(tierName)
    const nowSeconds = Math.floor(Date.now() / 1000)

    const minute = await this.tickWindow(
      `api_v2:${apiKeyId}:1m:${Math.floor(nowSeconds / MINUTE_SECONDS)}`,
      tier.perMinute,
      MINUTE_SECONDS,
      nowSeconds
    )
    if (!minute.allowed) {
      return { ...minute, window: '1m' }
    }

    const hour = await this.tickWindow(
      `api_v2:${apiKeyId}:1h:${Math.floor(nowSeconds / HOUR_SECONDS)}`,
      tier.perHour,
      HOUR_SECONDS,
      nowSeconds
    )
    if (!hour.allowed) {
      return { ...hour, window: '1h' }
    }

    return { ...minute, window: '1m' }
  }

  private async tickWindow(
    key: string,
    limit: number,
    windowSeconds: number,
    nowSeconds: number
  ): Promise<Omit<ConsumeOutcome, 'window'>> {
    try {
      const result = await db.connection().rawQuery(
        `
        INSERT INTO rate_limits (key, points, expire_at)
        VALUES (?, 1, NOW() + INTERVAL '${windowSeconds} seconds')
        ON CONFLICT (key) DO UPDATE SET points = rate_limits.points + 1
        RETURNING points, EXTRACT(EPOCH FROM expire_at)::int AS expire_seconds
        `,
        [key]
      )
      const row = (result.rows ?? result)[0]
      const count = Number(row.points ?? 0)
      const resetSeconds = Math.max(0, Number(row.expire_seconds) - nowSeconds)
      const allowed = count <= limit
      const remaining = Math.max(0, limit - count)
      return { allowed, remaining, limit, resetSeconds }
    } catch {
      const entry = memoryStore.get(key)
      const expireAt = nowSeconds + windowSeconds
      if (!entry || entry.resetAt <= nowSeconds) {
        memoryStore.set(key, { count: 1, resetAt: expireAt })
        return { allowed: true, remaining: limit - 1, limit, resetSeconds: windowSeconds }
      }
      entry.count += 1
      const allowed = entry.count <= limit
      const remaining = Math.max(0, limit - entry.count)
      return { allowed, remaining, limit, resetSeconds: Math.max(0, entry.resetAt - nowSeconds) }
    }
  }
}

export default new ApiRateLimiter()
