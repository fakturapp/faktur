import crypto from 'node:crypto'

class OauthCryptoService {
  generateToken(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString('hex')
  }

  generateClientSecret(): string {
    return crypto.randomBytes(48).toString('base64url')
  }

  hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex')
  }

  timingSafeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) return false
    return crypto.timingSafeEqual(bufA, bufB)
  }

  verifyPkce(codeVerifier: string, codeChallenge: string, method: string): boolean {
    if (method !== 'S256') return false
    const hash = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest()
      .toString('base64url')
    return this.timingSafeEqual(hash, codeChallenge)
  }

  hmacSign(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex')
  }
}

export default new OauthCryptoService()
