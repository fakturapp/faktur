import { EndpointBlock } from '@/components/endpoint-block'
import { API_V2_BASE_URL } from '@/lib/config'

export const metadata = { title: 'Quotes · Faktur API V2' }

export default function QuotesReference() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">
        Reference / Resources
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Quotes</h1>
      <p className="mt-4 text-(--muted-foreground)">
        Quotes are pre-sale proposals. When a client accepts a quote, it converts to an invoice
        (linked via <code>source_quote_id</code>).
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Status values</h2>
        <p className="mt-3 text-sm text-(--muted-foreground)">
          <code>draft</code> · <code>sent</code> · <code>accepted</code> · <code>refused</code> ·{' '}
          <code>expired</code>
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Object shape</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-(--border) bg-(--code-bg) p-4 text-xs leading-relaxed">
          <code>{`{
  "id": "qot_8KqL2x...",
  "number": "DEV-2026-0042",
  "status": "sent",
  "subject": "Migration to Faktur",
  "issue_date": "2026-05-16",
  "validity_date": "2026-06-15",
  "language": "fr",
  "currency": "EUR",
  "client_id": "clt_8KqL2x...",
  "subtotal_cents": 500000,
  "tax_cents": 100000,
  "total_cents": 600000,
  "global_discount_type": "none",
  "global_discount_value": 0,
  "vat_exempt_reason": "none",
  "lines": [
    {
      "id": "ql_...",
      "position": 1,
      "description": "Architecture phase",
      "quantity": 5,
      "unit": "day",
      "unit_price_cents": 80000,
      "vat_rate": 20,
      "total_cents": 400000
    }
  ],
  "created_at": "2026-05-16T14:32:11Z",
  "updated_at": "2026-05-16T14:32:11Z"
}`}</code>
        </pre>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Endpoints</h2>

        <EndpointBlock
          method="GET"
          path="/api/v2/quotes"
          scope="quotes:read"
          description="List quotes. Supports status filter, client filter, date ranges, and sorting."
          example={`curl '${API_V2_BASE_URL}/quotes?status=accepted&limit=50' \\
  -H "Authorization: Bearer fk_live_..."`}
        />

        <EndpointBlock
          method="GET"
          path="/api/v2/quotes/:id"
          scope="quotes:read"
          description="Retrieve a single quote with its lines."
        />

        <div className="mt-8 rounded-xl border border-(--border) bg-(--muted)/30 p-4">
          <p className="text-sm font-semibold">Coming next</p>
          <p className="mt-1 text-xs text-(--muted-foreground)">
            <code>POST /api/v2/quotes</code> (create), <code>PATCH /api/v2/quotes/:id</code>,{' '}
            <code>POST /api/v2/quotes/:id/send</code>,{' '}
            <code>POST /api/v2/quotes/:id/accept</code>, <code>...&#47;reject</code>, and{' '}
            <code>...&#47;convert-to-invoice</code>.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Related webhooks</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-(--muted-foreground)">
          <li>
            <code>quote.created</code>, <code>quote.updated</code>, <code>quote.sent</code>
          </li>
          <li>
            <code>quote.accepted</code>, <code>quote.rejected</code>, <code>quote.expired</code>
          </li>
          <li>
            <code>quote.converted</code>. fires when a quote becomes an invoice
          </li>
        </ul>
      </section>
    </div>
  )
}
