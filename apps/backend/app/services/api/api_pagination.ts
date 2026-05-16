export interface CursorPayload {
  id: string
  created_at: string
}

export const DEFAULT_LIMIT = 50
export const MAX_LIMIT = 200

export interface ParsedCursor {
  limit: number
  cursor: CursorPayload | null
}

class ApiPagination {
  parseLimit(rawLimit: unknown): number {
    const n = Number.parseInt(String(rawLimit ?? ''), 10)
    if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT
    return Math.min(n, MAX_LIMIT)
  }

  encodeCursor(payload: CursorPayload): string {
    return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  }

  decodeCursor(raw: string | undefined | null): CursorPayload | null {
    if (!raw) return null
    try {
      const decoded = Buffer.from(raw, 'base64url').toString('utf8')
      const parsed = JSON.parse(decoded)
      if (typeof parsed?.id !== 'string' || typeof parsed?.created_at !== 'string') return null
      return parsed
    } catch {
      return null
    }
  }

  parse(query: Record<string, any>): ParsedCursor {
    return {
      limit: this.parseLimit(query.limit),
      cursor: this.decodeCursor(query.cursor),
    }
  }

  buildNext<T extends { id: string; createdAt: { toISO(): string | null } | string }>(
    items: T[],
    limit: number
  ): { items: T[]; nextCursor: string | null; hasMore: boolean } {
    if (items.length <= limit) {
      return { items, nextCursor: null, hasMore: false }
    }
    const sliced = items.slice(0, limit)
    const last = sliced[sliced.length - 1]
    const created =
      typeof last.createdAt === 'string'
        ? last.createdAt
        : (last.createdAt.toISO() ?? new Date().toISOString())
    const nextCursor = this.encodeCursor({ id: last.id, created_at: created })
    return { items: sliced, nextCursor, hasMore: true }
  }
}

export default new ApiPagination()
