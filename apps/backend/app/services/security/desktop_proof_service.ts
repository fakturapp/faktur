import crypto from 'node:crypto'
import env from '#start/env'


const PROOF_TTL_MS = 5 * 60 * 1000
const NONCE_CACHE_MAX = 10_000

const usedNonces = new Map<string, number>()

function rememberNonce(nonce: string, ts: number) {
  usedNonces.set(nonce, ts)
  if (usedNonces.size > NONCE_CACHE_MAX) {
    const cutoff = Date.now() - PROOF_TTL_MS
    for (const [k, v] of usedNonces) {
      if (v < cutoff) usedNonces.delete(k)
    }
  }
}

export interface DesktopProof {
  signature: string
  nonce: string
  ts: number
  clientId: string
}

export function verifyDesktopProof(proof: DesktopProof | null): boolean {
  if (!proof) return false
  const { signature, nonce, ts, clientId } = proof

  if (!signature || !nonce || !ts || !clientId) return false

  const drift = Math.abs(Date.now() - ts)
  if (drift > PROOF_TTL_MS) return false

  if (usedNonces.has(nonce)) return false

  const key = env.get('FAKTUR_DESKTOP_PROOF_KEY', 'faktur-desktop-v1-proof-key-change-in-prod')
  const material = `${nonce}:${ts}:${clientId}`
  const expected = crypto.createHmac('sha256', key).update(material).digest('base64url')

  let ok = false
  try {
    ok = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    ok = false
  }

  if (ok) rememberNonce(nonce, ts)
  return ok
}

// ---------- Request helper ----------
export function extractProofFromHeaders(headers: Record<string, any>): DesktopProof | null {
  const signature = headers['x-faktur-desktop-proof']
  const nonce = headers['x-faktur-desktop-nonce']
  const tsRaw = headers['x-faktur-desktop-ts']
  const clientId = headers['x-faktur-desktop-client-id'] ?? headers['x-faktur-desktop-cid']

  if (!signature || !nonce || !tsRaw) return null
  const ts = Number.parseInt(String(tsRaw), 10)
  if (!Number.isFinite(ts)) return null

  return {
    signature: String(signature),
    nonce: String(nonce),
    ts,
    clientId: String(clientId || ''),
  }
}
