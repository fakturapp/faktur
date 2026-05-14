// In-memory cache of generated PDFs.
//
// Generating a PDF runs a headless-Chrome render (slow). The cache keeps the
// last render per document, tagged with a `version` token derived from the
// document's updatedAt timestamps. A request for the same version is served
// from memory; once the document is modified the version changes and the
// stale entry is overwritten — so an unchanged document is never re-rendered.

interface CachedPdf {
  version: string
  pdfBuffer: Buffer
  filename: string
}

const MAX_ENTRIES = 60
const cache = new Map<string, CachedPdf>()

export const pdfCache = {
  /** Returns the cached PDF only if it matches the requested version. */
  get(docKey: string, version: string): { pdfBuffer: Buffer; filename: string } | null {
    const hit = cache.get(docKey)
    if (!hit || hit.version !== version) return null
    // Refresh LRU recency.
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
