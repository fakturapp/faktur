const BLACKLIST_URL = 'https://cdn.fakturapp.cc/assets/authentification/emailbacklist.json'
const CACHE_TTL_MS = 60 * 60 * 1000

let cachedDomains: Set<string> | null = null
let cacheTimestamp = 0

export default class EmailBlacklistService {
  private static async loadBlacklist(): Promise<Set<string>> {
    const now = Date.now()
    if (cachedDomains && now - cacheTimestamp < CACHE_TTL_MS) {
      return cachedDomains
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

      const res = await fetch(BLACKLIST_URL, { signal: controller.signal })
      clearTimeout(timeout)

      if (!res.ok) {
        if (cachedDomains) return cachedDomains
        return new Set()
      }

      const text = await res.text()
      let domains: string[]

      try {
        domains = JSON.parse(text) as string[]
      } catch {
        domains = []
        const regex = /"([a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,})"/g
        let match: RegExpExecArray | null
        while ((match = regex.exec(text)) !== null) {
          domains.push(match[1].toLowerCase())
        }
      }

      cachedDomains = new Set(
        domains
          .filter((d) => typeof d === 'string' && d.includes('.'))
          .map((d) => d.toLowerCase().trim())
      )
      cacheTimestamp = now
      return cachedDomains
    } catch {
      if (cachedDomains) return cachedDomains
      return new Set()
    }
  }

  static async isDisposableEmail(email: string): Promise<boolean> {
    const domain = email.toLowerCase().split('@')[1]
    if (!domain) return false

    const blacklist = await EmailBlacklistService.loadBlacklist()
    return blacklist.has(domain)
  }
}
