export const metadata = { title: 'Webhooks — Faktur Developers' }

export default function WebhooksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Concept</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Webhooks</h1>
      <p className="mt-4 text-(--muted-foreground)">
        Faktur sends event notifications to your HTTPS endpoint with HMAC-SHA256 signatures and
        anti-replay timestamps. Configure one webhook URL per API key.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Headers on every delivery</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-(--border) bg-(--code-bg) p-4 text-xs">
          <code>{`X-Faktur-Signature: t=1747401131,v1=5d6f8a9e2c4b1f...
X-Faktur-Event-Id: evt_8KqL2x...
X-Faktur-Event-Type: invoice.paid
X-Faktur-Delivery: 1
User-Agent: Faktur-Webhooks/2.0
Content-Type: application/json`}</code>
        </pre>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Verifying the signature</h2>
        <p className="mt-3 text-sm">
          Compute <code>HMAC-SHA256(secret, &quot;&lt;timestamp&gt;.&lt;raw_body&gt;&quot;)</code>{' '}
          and compare in constant time. Reject deliveries where the timestamp is more than 5
          minutes old (replay protection).
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-(--border) bg-(--code-bg) p-4 text-xs leading-relaxed">
          <code>{`// Node.js example
import crypto from 'node:crypto'

function verify(rawBody, signatureHeader, secret) {
  const t = /t=(\\d+)/.exec(signatureHeader)?.[1]
  const v1 = /v1=([a-f0-9]+)/.exec(signatureHeader)?.[1]
  if (!t || !v1) return false

  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - Number(t)) > 300) return false // anti-replay

  const expected = crypto
    .createHmac('sha256', secret)
    .update(\`\${t}.\${rawBody}\`)
    .digest('hex')

  const a = Buffer.from(v1, 'hex')
  const b = Buffer.from(expected, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}`}</code>
        </pre>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Payload shape</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-(--border) bg-(--code-bg) p-4 text-xs leading-relaxed">
          <code>{`{
  "id": "evt_8KqL2x...",
  "type": "invoice.paid",
  "created_at": "2026-05-16T14:32:11Z",
  "api_version": "v2",
  "team_id": "tm_...",
  "data": {
    "invoice": { /* full invoice object */ },
    "payment": {
      "amount_cents": 120000,
      "method": "bank_transfer",
      "reference": "VIR-2026-05-99",
      "paid_at": "2026-05-16"
    }
  },
  "previous_data": null
}`}</code>
        </pre>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Retry policy</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-(--border)">
          <table className="w-full text-sm">
            <thead className="bg-(--muted)/40">
              <tr className="text-left">
                <th className="px-3 py-2 text-xs uppercase tracking-wider text-(--muted-foreground)">
                  Attempt
                </th>
                <th className="px-3 py-2 text-xs uppercase tracking-wider text-(--muted-foreground)">
                  Delay after failure
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ['1', 'immediate'],
                ['2', '+30 s'],
                ['3', '+2 min'],
                ['4', '+10 min'],
                ['5', '+1 h'],
                ['6', '+6 h'],
                ['7', '+24 h'],
                ['8+', 'permanent failure'],
              ].map(([n, d]) => (
                <tr key={n} className="border-t border-(--border)">
                  <td className="px-3 py-2 font-mono text-xs">{n}</td>
                  <td className="px-3 py-2 text-(--muted-foreground)">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-(--muted-foreground)">
          Delivery counts as success on any 2xx response. Five consecutive <code>410 Gone</code>{' '}
          responses auto-disable the webhook.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Idempotency on your side</h2>
        <p className="mt-3 text-sm text-(--muted-foreground)">
          Faktur may deliver the same event more than once (after a failed retry, manual replay,
          or network glitch). Dedupe on <code>X-Faktur-Event-Id</code> in your handler.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Available events</h2>
        <p className="mt-3 text-sm text-(--muted-foreground)">
          30 event types across 10 categories. Pick which ones you receive in the dashboard.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-(--border) bg-(--code-bg) p-4 text-xs">
          <code>{`invoice.created, invoice.updated, invoice.sent, invoice.paid,
invoice.partially_paid, invoice.overdue, invoice.deleted

quote.created, quote.updated, quote.sent, quote.accepted,
quote.rejected, quote.expired, quote.converted

credit_note.created, credit_note.sent
client.created, client.updated, client.deleted
product.created, product.updated, product.deleted
expense.created, expense.updated, expense.deleted
recurring_invoice.generated
payment.received
reminder.sent
einvoicing.submitted, einvoicing.status_changed`}</code>
        </pre>
      </section>
    </div>
  )
}
