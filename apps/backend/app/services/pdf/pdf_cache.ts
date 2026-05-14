interface CachedPdf {
  version: string
  pdfBuffer: Buffer
  filename: string
}

const MAX_ENTRIES = 60
const cache = new Map<string, CachedPdf>()

export const pdfCache = {
  get(docKey: string, version: string): { pdfBuffer: Buffer; filename: string } | null {
    const hit = cache.get(docKey)
    if (!hit || hit.version !== version) return null
    cache.delete(docKey)
    cache.set(docKey, hit)
    return { pdfBuffer: hit.pdfBuffer, filename: hit.filename }
  },

  set(docKey: string, version: string, pdfBuffer: Buffer, filename: string): void {
    cache.delete(docKey)
    cache.set(docKey, { version, pdfBuffer, filename })
    while (cache.size > MAX_ENTRIES) {
      const oldest = cache.keys().next().value
      if (oldest === undefined) break
      cache.delete(oldest)
    }
  },

  invalidate(docKey: string): void {
    cache.delete(docKey)
  },
}
