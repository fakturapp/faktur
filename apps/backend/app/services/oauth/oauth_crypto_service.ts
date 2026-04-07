import crypto from 'node:crypto'

/**
 * Low-level crypto helpers dedicated to the OAuth server. Everything here
 * is pure, side-effect free, and stateless so it can be unit-tested
 * without touching the DB or the env.
 *
 * Uses SHA-256 for token hashes (fast lookup in a btree index) and a
 * constant-time compare for any equality check that involves secrets.
 */
class OauthCryptoService {
  /**
   * Generates a url-safe 64-char hex token (256 bits of entropy).
   * Used for client_id, authorization codes, access and refresh tokens.
   */
  generateToken(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString('hex')
  }

  /**
   * Generates a long client_secret. Admins see this value exactly once at
   * creation; only the SHA-256 hash is ever persisted.
   */
  generateClientSecret(): string {
    return crypto.randomBytes(48).toString('base64url')
  }

  /**
   * Stable hash for lookup. Do NOT use for passwords — this is only fit
   * for high-entropy secrets where rainbow tables are impossible.
   */
  hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex')
  }

  /**
   * Constant-time comparison. Both buffers must be the same length —
   * if not, returns false without leaking the length mismatch.
   */
  timingSafeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) return false
    return crypto.timingSafeEqual(bufA, bufB)
  }

  /**
   * PKCE verification per RFC 7636. We only support the S256 method:
   * the plain method is forbidden because it provides no protection.
   */
  verifyPkce(codeVerifier: string, codeChallenge: string, method: string): boolean {
    if (method !== 'S256') return false
    const hash = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest()
      .toString('base64url')
    return this.timingSafeEqual(hash, codeChallenge)
  }

  /**
   * Computes an HMAC-SHA256 signature for webhook payloads. The receiving
   * app verifies this via the X-Faktur-Signature header.
   */
  hmacSign(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex')
  }
}

export default new OauthCryptoService()
