import crypto from 'node:crypto'

export default class WebhookService {
  static sign(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex')
  }

  static verify(payload: string, signature: string, secret: string): boolean {
    const expected = this.sign(payload, secret)
    if (signature.length !== expected.length) return false
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  }

  static verifyWithReplayProtection(
    payload: string,
    signature: string,
    timestamp: string | number,
    secret: string,
    maxAgeSeconds = 300
  ): { valid: boolean; reason?: string } {
    const ts = typeof timestamp === 'string' ? Number.parseInt(timestamp, 10) : timestamp
    const now = Math.floor(Date.now() / 1000)

    if (Number.isNaN(ts)) {
      return { valid: false, reason: 'Invalid timestamp' }
    }

    if (Math.abs(now - ts) > maxAgeSeconds) {
      return { valid: false, reason: 'Timestamp expired (replay protection)' }
    }

    const signedPayload = `${ts}.${payload}`
    const isValid = this.verify(signedPayload, signature, secret)

    return isValid ? { valid: true } : { valid: false, reason: 'Invalid signature' }
  }
}
