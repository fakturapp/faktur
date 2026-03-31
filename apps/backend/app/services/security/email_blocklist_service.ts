import { DISPOSABLE_EMAIL_DOMAINS } from '#data/disposable_email_domains'
import EmailBlocklist from '#models/security/email_blocklist'

export default class EmailBlocklistService {
  private static blockedDomains: Set<string> | null = null
  private static allowedDomains: Set<string> | null = null
  private static initialized = false

  /**
   * Lazy-load: merge static list with DB overrides.
   * Called once, then all lookups are O(1) from memory.
   */
  private static async init() {
    if (this.initialized) return

    this.blockedDomains = new Set(DISPOSABLE_EMAIL_DOMAINS)
    this.allowedDomains = new Set<string>()

    const overrides = await EmailBlocklist.all()
    for (const entry of overrides) {
      if (entry.action === 'block') {
        this.blockedDomains.add(entry.domain.toLowerCase())
        this.allowedDomains.delete(entry.domain.toLowerCase())
      } else if (entry.action === 'allow') {
        this.allowedDomains.add(entry.domain.toLowerCase())
        this.blockedDomains.delete(entry.domain.toLowerCase())
      }
    }

    this.initialized = true
  }

  /**
   * Check if an email address uses a blocked disposable domain.
   */
  static async isBlocked(email: string): Promise<boolean> {
    await this.init()
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) return false
    if (this.allowedDomains!.has(domain)) return false
    return this.blockedDomains!.has(domain)
  }

  /**
   * Extract domain from email.
   */
  static extractDomain(email: string): string {
    return email.split('@')[1]?.toLowerCase() || ''
  }

  /**
   * Add a domain to the blocklist (admin action).
   * Persists to DB and updates in-memory cache immediately.
   */
  static async addDomain(domain: string, reason?: string) {
    await this.init()
    const normalized = domain.toLowerCase().trim()

    await EmailBlocklist.updateOrCreate(
      { domain: normalized },
      { domain: normalized, action: 'block', reason: reason || null }
    )

    this.blockedDomains!.add(normalized)
    this.allowedDomains!.delete(normalized)
  }

  /**
   * Allow a domain (override static blocklist, e.g. approved appeal).
   * Persists to DB and updates in-memory cache immediately.
   */
  static async allowDomain(domain: string, reason?: string) {
    await this.init()
    const normalized = domain.toLowerCase().trim()

    await EmailBlocklist.updateOrCreate(
      { domain: normalized },
      { domain: normalized, action: 'allow', reason: reason || null }
    )

    this.allowedDomains!.add(normalized)
    this.blockedDomains!.delete(normalized)
  }

  /**
   * Remove a domain from DB overrides (revert to static list behavior).
   */
  static async removeDomain(domain: string) {
    await this.init()
    const normalized = domain.toLowerCase().trim()

    await EmailBlocklist.query().where('domain', normalized).delete()

    this.allowedDomains!.delete(normalized)

    // Restore from static list if it was there
    if (DISPOSABLE_EMAIL_DOMAINS.has(normalized)) {
      this.blockedDomains!.add(normalized)
    } else {
      this.blockedDomains!.delete(normalized)
    }
  }

  /**
   * Get total count of blocked domains (static + DB).
   */
  static async getBlockedCount(): Promise<number> {
    await this.init()
    return this.blockedDomains!.size
  }
}
