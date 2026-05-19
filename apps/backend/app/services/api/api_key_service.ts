import crypto from 'node:crypto'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import ApiKey from '#models/api/api_key'
import scopeChecker from '#services/api/scope_checker'

export const API_KEY_PREFIX = 'fk_live_'
export const API_KEY_SECRET_LENGTH = 32
export const API_KEY_RANDOM_BYTES = 24

export interface GeneratedKey {
  plaintext: string
  hash: string
  prefix: string
  last4: string
}

export interface CreateApiKeyInput {
  teamId: string
  projectId: string
  createdByUserId: string | null
  name: string
  scopes: string[]
  rateLimitTier?: string
  allowedIps?: string[] | null
  expiresAt?: DateTime | null
}

export interface CreatedApiKey {
  record: ApiKey
  plaintext: string
}

class ApiKeyService {
  generate(): GeneratedKey {
    const secret = crypto
      .randomBytes(API_KEY_RANDOM_BYTES)
      .toString('base64url')
      .slice(0, API_KEY_SECRET_LENGTH)
    const plaintext = `${API_KEY_PREFIX}${secret}`
    const hash = this.hashToken(plaintext)
    return {
      plaintext,
      hash,
      prefix: API_KEY_PREFIX,
      last4: plaintext.slice(-4),
    }
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  extractFromHeader(authorizationHeader: string | undefined | null): string | null {
    if (!authorizationHeader) return null
    const trimmed = authorizationHeader.trim()
    const match = /^Bearer\s+(\S+)$/i.exec(trimmed)
    return match ? match[1] : null
  }

  looksLikeApiKey(token: string): boolean {
    return token.startsWith(API_KEY_PREFIX) && token.length > API_KEY_PREFIX.length
  }

  async create(input: CreateApiKeyInput): Promise<CreatedApiKey> {
    const validScopes = input.scopes.filter((s) => scopeChecker.validate(s))
    if (validScopes.length === 0) {
      throw new ApiKeyValidationError('At least one valid scope is required')
    }
    const normalizedScopes = scopeChecker.normalize(validScopes)

    const gen = this.generate()
    const record = await ApiKey.create({
      teamId: input.teamId,
      projectId: input.projectId,
      createdByUserId: input.createdByUserId,
      name: input.name.trim(),
      prefix: gen.prefix,
      last4: gen.last4,
      hash: gen.hash,
      scopes: normalizedScopes,
      rateLimitTier: input.rateLimitTier ?? 'default',
      allowedIps: input.allowedIps ?? null,
      expiresAt: input.expiresAt ?? null,
      usageCount: 0,
    })
    return { record, plaintext: gen.plaintext }
  }

  async findActiveByToken(token: string): Promise<ApiKey | null> {
    if (!this.looksLikeApiKey(token)) return null
    const hash = this.hashToken(token)
    const key = await ApiKey.query().where('hash', hash).whereNull('revoked_at').first()
    if (!key) return null
    if (key.isExpired) return null
    return key
  }

  async rotate(apiKeyId: string): Promise<{ record: ApiKey; plaintext: string }> {
    const existing = await ApiKey.findOrFail(apiKeyId)
    if (existing.isRevoked) throw new ApiKeyValidationError('Cannot rotate a revoked key')

    const gen = this.generate()
    existing.prefix = gen.prefix
    existing.last4 = gen.last4
    existing.hash = gen.hash
    existing.rotatingToId = null
    existing.rotationGraceUntil = null
    existing.lastUsedAt = null
    existing.lastIp = null
    await existing.save()

    return { record: existing, plaintext: gen.plaintext }
  }

  async revoke(apiKeyId: string, reason = 'manual'): Promise<ApiKey> {
    const key = await ApiKey.findOrFail(apiKeyId)
    if (key.isRevoked) return key
    key.revokedAt = DateTime.now()
    key.revokedReason = reason
    await key.save()
    return key
  }

  async revokeAllForTeam(teamId: string, reason: string): Promise<number> {
    const updated = await ApiKey.query()
      .where('teamId', teamId)
      .whereNull('revoked_at')
      .update({ revoked_at: DateTime.now().toSQL(), revoked_reason: reason })
    return Array.isArray(updated) ? updated.length : Number(updated ?? 0)
  }

  async touchUsage(apiKeyId: string, ip: string): Promise<void> {
    await ApiKey.query()
      .where('id', apiKeyId)
      .update({
        last_used_at: DateTime.now().toSQL(),
        last_ip: ip,
        usage_count: db.raw('usage_count + 1') as any,
      })
      .catch(async () => {
        const key = await ApiKey.find(apiKeyId)
        if (!key) return
        key.lastUsedAt = DateTime.now()
        key.lastIp = ip
        key.usageCount = (key.usageCount ?? 0) + 1
        await key.save()
      })
  }

  isAllowedIp(key: ApiKey, ip: string): boolean {
    if (!key.allowedIps || key.allowedIps.length === 0) return true
    return key.allowedIps.some((entry) => matchCidrOrIp(entry, ip))
  }
}

export class ApiKeyValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiKeyValidationError'
  }
}

function matchCidrOrIp(entry: string, ip: string): boolean {
  if (!entry.includes('/')) return entry === ip
  const [base, prefixStr] = entry.split('/')
  const prefix = Number.parseInt(prefixStr, 10)
  if (!Number.isFinite(prefix)) return false
  if (base.includes(':') || ip.includes(':')) {
    return entry === ip
  }
  const baseLong = ipv4ToLong(base)
  const ipLong = ipv4ToLong(ip)
  if (baseLong === null || ipLong === null) return false
  if (prefix < 0 || prefix > 32) return false
  if (prefix === 0) return true
  const mask = (0xffffffff << (32 - prefix)) >>> 0
  return (baseLong & mask) === (ipLong & mask)
}

function ipv4ToLong(ip: string): number | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  let result = 0
  for (const part of parts) {
    const n = Number.parseInt(part, 10)
    if (!Number.isFinite(n) || n < 0 || n > 255) return null
    result = (result << 8) | n
  }
  return result >>> 0
}

export default new ApiKeyService()
