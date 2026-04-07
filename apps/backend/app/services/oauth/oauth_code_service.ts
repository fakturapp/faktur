import { DateTime } from 'luxon'
import OauthCode from '#models/oauth/oauth_code'
import oauthCrypto from '#services/oauth/oauth_crypto_service'
import { OAUTH_CODE_TTL_MINUTES } from '#services/oauth/oauth_constants'

export interface IssueCodeInput {
  oauthAppId: string
  userId: string
  redirectUri: string
  scopes: string[]
  codeChallenge?: string | null
  codeChallengeMethod?: string | null
  clientIp?: string | null
  userAgent?: string | null
}

export interface IssuedCode {
  record: OauthCode
  rawCode: string
}

class OauthCodeService {
  /**
   * Mints a fresh one-time authorization code. The raw value is embedded
   * in the redirect URL sent back to the client; only its SHA-256 hash
   * lands in the DB.
   */
  async issue(input: IssueCodeInput): Promise<IssuedCode> {
    const rawCode = oauthCrypto.generateToken(32)
    const codeHash = oauthCrypto.hash(rawCode)
    const expiresAt = DateTime.now().plus({ minutes: OAUTH_CODE_TTL_MINUTES })

    const record = await OauthCode.create({
      codeHash,
      oauthAppId: input.oauthAppId,
      userId: input.userId,
      redirectUri: input.redirectUri,
      scopes: input.scopes,
      codeChallenge: input.codeChallenge ?? null,
      codeChallengeMethod: input.codeChallengeMethod ?? null,
      expiresAt,
      usedAt: null,
      clientIp: input.clientIp ?? null,
      userAgent: input.userAgent ?? null,
    })

    return { record, rawCode }
  }

  /**
   * Looks up a raw code, marks it as used, and returns the record iff
   * it is still redeemable (not expired, not already used). This is
   * atomic-ish: we call `save()` right after the redeemability check,
   * and callers hold the single DB connection for the duration.
   *
   * The caller is responsible for validating the redirect_uri + PKCE
   * verifier before handing out a token.
   */
  async redeem(rawCode: string): Promise<OauthCode | null> {
    const codeHash = oauthCrypto.hash(rawCode)
    const record = await OauthCode.query().where('code_hash', codeHash).first()
    if (!record) return null
    if (!record.isRedeemable) return null

    record.usedAt = DateTime.now()
    await record.save()
    return record
  }

  /**
   * Cleanup helper — removes codes past their expiry. Called by a
   * scheduled worker / cron so the table doesn't grow forever.
   */
  async purgeExpired(): Promise<number> {
    const result = await OauthCode.query().where('expires_at', '<', DateTime.now().toSQL()!).delete()
    return Number(result[0] ?? 0)
  }
}

export default new OauthCodeService()
