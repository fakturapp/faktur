import { DateTime } from 'luxon'
import OauthToken from '#models/oauth/oauth_token'
import oauthCrypto from '#services/oauth/oauth_crypto_service'
import {
  OAUTH_ACCESS_TOKEN_TTL_HOURS,
  OAUTH_REFRESH_TOKEN_TTL_DAYS,
} from '#services/oauth/oauth_constants'

export interface IssueTokenInput {
  oauthAppId: string
  userId: string
  scopes: string[]
  deviceName?: string | null
  devicePlatform?: string | null
  deviceOs?: string | null
  ip?: string | null
  userAgent?: string | null
}

export interface IssuedToken {
  record: OauthToken
  rawAccessToken: string
  rawRefreshToken: string
  accessTokenExpiresAt: DateTime
  refreshTokenExpiresAt: DateTime
}

class OauthTokenService {
  async issue(input: IssueTokenInput): Promise<IssuedToken> {
    const rawAccessToken = oauthCrypto.generateToken(32)
    const rawRefreshToken = oauthCrypto.generateToken(32)
    const now = DateTime.now()
    const accessTokenExpiresAt = now.plus({ hours: OAUTH_ACCESS_TOKEN_TTL_HOURS })
    const refreshTokenExpiresAt = now.plus({ days: OAUTH_REFRESH_TOKEN_TTL_DAYS })

    const record = await OauthToken.create({
      accessTokenHash: oauthCrypto.hash(rawAccessToken),
      refreshTokenHash: oauthCrypto.hash(rawRefreshToken),
      oauthAppId: input.oauthAppId,
      userId: input.userId,
      scopes: input.scopes,
      deviceName: input.deviceName ?? null,
      devicePlatform: input.devicePlatform ?? null,
      deviceOs: input.deviceOs ?? null,
      lastIp: input.ip ?? null,
      lastUserAgent: input.userAgent ?? null,
      expiresAt: accessTokenExpiresAt,
      refreshExpiresAt: refreshTokenExpiresAt,
      lastUsedAt: now,
      revokedAt: null,
      revokedReason: null,
    })

    return {
      record,
      rawAccessToken,
      rawRefreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    }
  }

  async rotate(current: OauthToken, ip: string | null, userAgent: string | null): Promise<IssuedToken> {
    current.revokedAt = DateTime.now()
    current.revokedReason = 'rotated'
    await current.save()

    return this.issue({
      oauthAppId: current.oauthAppId,
      userId: current.userId,
      scopes: current.scopes,
      deviceName: current.deviceName,
      devicePlatform: current.devicePlatform,
      deviceOs: current.deviceOs,
      ip,
      userAgent,
    })
  }

  async findActiveByAccessToken(rawAccessToken: string): Promise<OauthToken | null> {
    const hash = oauthCrypto.hash(rawAccessToken)
    const token = await OauthToken.query().where('access_token_hash', hash).first()
    if (!token || !token.isValid) return null
    return token
  }

  async findActiveByRefreshToken(rawRefreshToken: string): Promise<OauthToken | null> {
    const hash = oauthCrypto.hash(rawRefreshToken)
    const token = await OauthToken.query().where('refresh_token_hash', hash).first()
    if (!token || !token.isRefreshable) return null
    return token
  }

  async revoke(token: OauthToken, reason: string): Promise<void> {
    if (token.revokedAt) return
    token.revokedAt = DateTime.now()
    token.revokedReason = reason
    await token.save()
  }

  async revokeAllForUserApp(userId: string, oauthAppId: string, reason: string): Promise<number> {
    const tokens = await OauthToken.query()
      .where('user_id', userId)
      .where('oauth_app_id', oauthAppId)
      .whereNull('revoked_at')
    let count = 0
    for (const t of tokens) {
      await this.revoke(t, reason)
      count += 1
    }
    return count
  }

  async touch(token: OauthToken, ip: string | null, userAgent: string | null): Promise<void> {
    token.lastUsedAt = DateTime.now()
    if (ip) token.lastIp = ip
    if (userAgent) token.lastUserAgent = userAgent
    await token.save()
  }
}

export default new OauthTokenService()
