interface GeoResult {
  country: string
  countryName: string
  city: string
}

interface CacheEntry {
  data: GeoResult
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()
const TTL_MS = 60 * 60 * 1000

const UNKNOWN_GEO: GeoResult = { country: '', countryName: '', city: '' }

export async function getGeoFromIp(ip: string): Promise<GeoResult> {
  if (!ip || ip === '127.0.0.1' || ip === '::1') {
    return UNKNOWN_GEO
  }

  const cached = cache.get(ip)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,city`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)

    if (!response.ok) return UNKNOWN_GEO

    const data: any = await response.json()

    if (data.status !== 'success') return UNKNOWN_GEO

    const result: GeoResult = {
      country: (data.countryCode || '').slice(0, 2).toUpperCase(),
      countryName: data.country || '',
      city: data.city || '',
    }

    cache.set(ip, { data: result, expiresAt: Date.now() + TTL_MS })

    // Evict expired entries periodically
    if (cache.size > 10000) {
      const now = Date.now()
      for (const [key, entry] of cache) {
        if (entry.expiresAt < now) cache.delete(key)
      }
    }

    return result
  } catch {
    return UNKNOWN_GEO
  }
}
