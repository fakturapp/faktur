import crypto from 'node:crypto'

export const WEBHOOK_SECRET_PREFIX = 'whsec_'
export const WEBHOOK_SECRET_LENGTH = 32
export const SIGNATURE_TOLERANCE_SECONDS = 300

export interface GeneratedWebhookSecret {
  plaintext: string
  hash: string
  last4: string
}

export interface SignedHeaders {
  signature: string
  timestamp: number
}

class WebhookSigner {
  generateSecret(): GeneratedWebhookSecret {
    const secret = crypto.randomBytes(24).toString('base64url').slice(0, WEBHOOK_SECRET_LENGTH)
    const plaintext = `${WEBHOOK_SECRET_PREFIX}${secret}`
    const hash = crypto.createHash('sha256').update(plaintext).digest('hex')
    return { plaintext, hash, last4: plaintext.slice(-4) }
  }

  hashSecret(plaintext: string): string {
    return crypto.createHash('sha256').update(plaintext).digest('hex')
  }

  sign(rawBody: string, secret: string, timestampSeconds?: number): SignedHeaders {
    const timestamp = timestampSeconds ?? Math.floor(Date.now() / 1000)
    const signedPayload = `${timestamp}.${rawBody}`
    const v1 = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex')
    return {
      signature: `t=${timestamp},v1=${v1}`,
      timestamp,
    }
  }

  verify(rawBody: string, secret: string, signatureHeader: string): boolean {
    const parsed = this.parseSignatureHeader(signatureHeader)
    if (!parsed) return false

    const nowSeconds = Math.floor(Date.now() / 1000)
    if (Math.abs(nowSeconds - parsed.timestamp) > SIGNATURE_TOLERANCE_SECONDS) {
      return false
    }

    const signedPayload = `${parsed.timestamp}.${rawBody}`
    const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex')

    const a = Buffer.from(parsed.v1, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  }

  parseSignatureHeader(
    header: string
  ): { timestamp: number; v1: string } | null {
    const parts = header.split(',').map((p) => p.trim())
    let timestamp: number | null = null
    let v1: string | null = null
    for (const part of parts) {
      if (part.startsWith('t=')) {
        const ts = Number.parseInt(part.slice(2), 10)
        if (Number.isFinite(ts)) timestamp = ts
      } else if (part.startsWith('v1=')) {
        v1 = part.slice(3)
      }
    }
    if (timestamp === null || !v1) return null
    if (!/^[0-9a-f]+$/i.test(v1)) return null
    return { timestamp, v1 }
  }
}

export default new WebhookSigner()
