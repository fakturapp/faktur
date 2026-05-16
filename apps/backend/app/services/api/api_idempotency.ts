import crypto from 'node:crypto'
import { DateTime } from 'luxon'
import ApiIdempotencyKey from '#models/api/api_idempotency_key'

export const IDEMPOTENCY_HEADER = 'faktur-idempotency-key'
export const IDEMPOTENCY_TTL_HOURS = 24

export interface StoredResult {
  status: number
  body: string
}

export type ReplayOutcome =
  | { kind: 'no_key' }
  | { kind: 'replay'; stored: StoredResult }
  | { kind: 'conflict' }
  | { kind: 'fresh' }

class ApiIdempotency {
  hashBody(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex')
  }

  async lookup(
    apiKeyId: string,
    keyHeader: string | undefined | null,
    method: string,
    path: string,
    rawBody: string
  ): Promise<ReplayOutcome> {
    if (!keyHeader) return { kind: 'no_key' }
    const trimmed = keyHeader.trim()
    if (!trimmed) return { kind: 'no_key' }

    const existing = await ApiIdempotencyKey.find(trimmed)
    if (!existing) return { kind: 'fresh' }
    if (existing.isExpired) {
      await existing.delete().catch(() => {})
      return { kind: 'fresh' }
    }

    if (existing.apiKeyId !== apiKeyId) return { kind: 'conflict' }
    if (existing.method.toUpperCase() !== method.toUpperCase()) return { kind: 'conflict' }
    if (existing.path !== path) return { kind: 'conflict' }
    if (existing.bodyHash !== this.hashBody(rawBody)) return { kind: 'conflict' }

    return {
      kind: 'replay',
      stored: {
        status: existing.responseStatus,
        body: existing.responseBody,
      },
    }
  }

  async store(input: {
    key: string
    apiKeyId: string
    method: string
    path: string
    rawBody: string
    responseStatus: number
    responseBody: string
  }): Promise<void> {
    try {
      await ApiIdempotencyKey.create({
        key: input.key,
        apiKeyId: input.apiKeyId,
        method: input.method.toUpperCase(),
        path: input.path,
        bodyHash: this.hashBody(input.rawBody),
        responseStatus: input.responseStatus,
        responseBody: input.responseBody,
        expiresAt: DateTime.now().plus({ hours: IDEMPOTENCY_TTL_HOURS }),
      })
    } catch {
      // silent — race with concurrent store should not break the request
    }
  }

  async purgeExpired(): Promise<number> {
    const result = await ApiIdempotencyKey.query()
      .where('expires_at', '<', DateTime.now().toSQL()!)
      .delete()
    return Array.isArray(result) ? (result[0] as number) : Number(result ?? 0)
  }
}

export default new ApiIdempotency()
