interface UserKeys {
  kek: Buffer
  deks: Map<string, Buffer>
  expiresAt: number
}

const DEFAULT_TTL_MS = 15 * 24 * 60 * 60 * 1000

class KeyStore {
  private store = new Map<string, UserKeys>()

  storeKeys(userId: string, kek: Buffer, teamId: string, dek: Buffer): void {
    let entry = this.store.get(userId)
    if (!entry) {
      entry = {
        kek,
        deks: new Map(),
        expiresAt: Date.now() + DEFAULT_TTL_MS,
      }
      this.store.set(userId, entry)
    } else {
      entry.kek = kek
      entry.expiresAt = Date.now() + DEFAULT_TTL_MS
    }
    entry.deks.set(teamId, dek)
  }

  storeDEK(userId: string, teamId: string, dek: Buffer): void {
    const entry = this.store.get(userId)
    if (!entry) {
      throw new Error('KEK not found — user must unlock first')
    }
    entry.deks.set(teamId, dek)
  }

  getDEK(userId: string, teamId: string): Buffer | null {
    const entry = this.store.get(userId)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.clear(userId)
      return null
    }
    return entry.deks.get(teamId) ?? null
  }

  getKEK(userId: string): Buffer | null {
    const entry = this.store.get(userId)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.clear(userId)
      return null
    }
    return entry.kek
  }

  isUnlocked(userId: string, teamId: string): boolean {
    return this.getDEK(userId, teamId) !== null
  }

  clear(userId: string): void {
    const entry = this.store.get(userId)
    if (entry) {
      entry.kek.fill(0)
      for (const dek of entry.deks.values()) {
        dek.fill(0)
      }
      entry.deks.clear()
    }
    this.store.delete(userId)
  }

  clearAll(): void {
    for (const [userId] of this.store) {
      this.clear(userId)
    }
  }
}

export default new KeyStore()
