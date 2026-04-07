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
  /**
   * Creates a fresh (access, refresh) pair. Both are 64-char hex strings
   * hashed before insertion — the raw values leave the server exactly
   * once in the JSON response of the /token endpoint.
   */
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

  /**
   * Rotates an active token: the old row is revoked and a fresh
   * (access, refresh) pair is issued. Refresh-token rotation is
   * mandatory per current OAuth security guidelines — reusing the
   * same refresh token forever is a replay vector.
   */
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

  /**
   * Looks up an access token by raw value. Returns the record only if
   * it's still valid (not expired, not revoked).
   */
  async findActiveByAccessToken(rawAccessToken: string): Promise<OauthToken | null> {
    const hash = oauthCrypto.hash(rawAccessToken)
    const token = await OauthToken.query().where('access_token_hash', hash).first()
    if (!token || !token.isValid) return null
    return token
  }

  /**
   * Looks up a refresh token by raw value. Returns the record only if
   * the refresh grant is still valid (refresh_expires_at in the future,
   * not revoked).
   */
  async findActiveByRefreshToken(rawRefreshToken: string): Promise<OauthToken | null> {
    const hash = oauthCrypto.hash(rawRefreshToken)
    const token = await OauthToken.query().where('refresh_token_hash', hash).first()
    if (!token || !token.isRefreshable) return null
    return token
  }

  /**
   * Revokes a single token and sets a reason string that surfaces in
   * the admin UI and the webhook payload.
   */
  async revoke(token: OauthToken, reason: string): Promise<void> {
    if (token.revokedAt) return
    token.revokedAt = DateTime.now()
    token.revokedReason = reason
    await token.save()
  }

  /**
   * Revokes every active token for a given (user, app) pair — used
   * when the user clicks 'Déconnecter cette application' in the
   * authorized apps screen.
   */
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

  /**
   * Updates last_used_at + last_ip for an active token. Called from
   * the auth middleware on every authenticated request — kept cheap
   * so it doesn't slow the hot path down.
   */
  async touch(token: OauthToken, ip: string | null, userAgent: string | null): Promise<void> {
    token.lastUsedAt = DateTime.now()
    if (ip) token.lastIp = ip
    if (userAgent) token.lastUserAgent = userAgent
    await token.save()
  }
}

export default new OauthTokenService()
