import { NextResponse, type NextRequest } from 'next/server'
import crypto from 'node:crypto'

const SIGNATURE_TOLERANCE_SECONDS = 300

export async function POST(request: NextRequest) {
  const secret = process.env.OAUTH_WEBHOOK_SECRET
  if (!secret || !secret.trim()) {
    return NextResponse.json(
      { error: 'OAUTH_WEBHOOK_SECRET is not configured' },
      { status: 500 }
    )
  }

  const signatureHeader = request.headers.get('x-faktur-signature')
  const timestampHeader = request.headers.get('x-faktur-timestamp')
  const eventType = request.headers.get('x-faktur-event')
  const eventId = request.headers.get('x-faktur-event-id')

  if (!signatureHeader || !timestampHeader || !eventType || !eventId) {
    return NextResponse.json(
      { error: 'Missing X-Faktur-* headers' },
      { status: 400 }
    )
  }

  const timestamp = Number.parseInt(timestampHeader, 10)
  if (!Number.isFinite(timestamp)) {
    return NextResponse.json({ error: 'Bad timestamp' }, { status: 400 })
  }
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (Math.abs(nowSeconds - timestamp) > SIGNATURE_TOLERANCE_SECONDS) {
    return NextResponse.json({ error: 'Timestamp out of tolerance' }, { status: 401 })
  }

  const rawBody = await request.text()

  const presented = signatureHeader.startsWith('sha256=')
    ? signatureHeader.slice('sha256='.length)
    : signatureHeader
  if (!/^[0-9a-f]+$/i.test(presented)) {
    return NextResponse.json({ error: 'Bad signature format' }, { status: 400 })
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(presented, 'hex')
  const b = Buffer.from(expected, 'hex')
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: { id: string; type: string; created_at: string; data: Record<string, unknown> }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }

  console.log(
    `[platform-webhook] received ${event.type} id=${event.id} data=${JSON.stringify(event.data)}`
  )

  return NextResponse.json({ received: true, id: event.id })
}

export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'oauth-webhook-receiver' })
}
