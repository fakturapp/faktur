import { EndpointBlock } from '@/components/endpoint-block'

export const metadata = { title: 'Invoices — Faktur API V2' }

export default function InvoicesReference() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">
        Reference / Resources
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Invoices</h1>
      <p className="mt-4 text-(--muted-foreground)">
        Invoices represent billable documents sent to clients. Amounts are always stored and
        returned in <strong>cents</strong>. Lines are nested; pagination is cursor-based.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Object shape</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-(--border) bg-(--code-bg) p-4 text-xs leading-relaxed">
          <code>{`{
  "id": "inv_8KqL2x...",
  "number": "FAC-2026-0042",
  "status": "sent",
  "subject": "Mission de conseil mai 2026",
  "issue_date": "2026-05-16",
  "due_date": "2026-06-15",
  "paid_date": null,
  "language": "fr",
  "currency": "EUR",
  "client_id": "clt_8KqL2x...",
  "client_name": "ACME SAS",
  "bank_account_id": "bnk_...",
  "source_quote_id": null,
  "subtotal_cents": 100000,
  "tax_cents": 20000,
  "total_cents": 120000,
  "global_discount_type": "none",
  "global_discount_value": 0,
  "vat_exempt_reason": "none",
  "vat_on_debits": false,
  "payment_terms": "30 days",
  "payment_method": null,
  "notes": null,
  "comment": null,
  "delivery_address": null,
  "operation_category": "service",
  "lines": [
    {
      "id": "il_...",
      "position": 1,
      "description": "Development consulting",
      "sale_type": null,
      "quantity": 10,
      "unit": "h",
      "unit_price_cents": 10000,
      "vat_rate": 20,
      "total_cents": 100000
    }
  ],
  "created_at": "2026-05-16T14:32:11Z",
  "updated_at": "2026-05-16T14:32:11Z"
}`}</code>
        </pre>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Status values</h2>
        <p className="mt-3 text-sm text-(--muted-foreground)">
          <code>draft</code> · <code>sent</code> · <code>paid</code> · <code>partial</code> ·{' '}
          <code>paid_unconfirmed</code> · <code>overdue</code> · <code>cancelled</code>
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Endpoints</h2>

        <EndpointBlock
          method="GET"
          path="/api/v2/invoices"
          scope="invoices:read"
          description="List invoices for the authenticated team. Supports pagination, status filter, date ranges, full-text search, and sorting."
          example={`curl https://api.fakturapp.cc/api/v2/invoices?status=paid,partial&limit=50 \\
  -H "Authorization: Bearer fk_live_..."`}
        />

        <div className="mt-4 rounded-xl border border-(--border) bg-(--muted)/30 p-4 text-xs">
          <p className="mb-2 font-semibold uppercase tracking-wider text-(--muted-foreground)">
            Query parameters
          </p>
          <ul className="space-y-1.5">
            <li>
              <code>limit</code> — 1–200, default 50
            </li>
            <li>
              <code>cursor</code> — pagination token
            </li>
            <li>
              <code>status</code> — comma-separated (e.g. <code>paid,partial</code>)
            </li>
            <li>
              <code>client_id</code> — <code>clt_</code> prefixed
            </li>
            <li>
              <code>issue_date_after</code>, <code>issue_date_before</code> — ISO date
            </li>
            <li>
              <code>due_date_after</code>, <code>due_date_before</code> — ISO date
            </li>
            <li>
              <code>q</code> — searches number, subject, notes
            </li>
            <li>
              <code>sort</code> — <code>created_at</code>, <code>-created_at</code>,{' '}
              <code>issue_date</code>, <code>-issue_date</code>
            </li>
          </ul>
        </div>

        <EndpointBlock
          method="GET"
          path="/api/v2/invoices/:id"
          scope="invoices:read"
          description="Retrieve a single invoice with its lines, client snapshot, and totals."
          example={`curl https://api.fakturapp.cc/api/v2/invoices/inv_8KqL2x... \\
  -H "Authorization: Bearer fk_live_..."`}
        />

        <EndpointBlock
          method="POST"
          path="/api/v2/invoices/:id/mark-paid"
          scope="invoices:write"
          description="Mark an invoice as paid (or partially paid). Triggers invoice.paid or invoice.partially_paid webhook."
          example={`curl https://api.fakturapp.cc/api/v2/invoices/inv_.../mark-paid \\
  -X POST \\
  -H "Authorization: Bearer fk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount_cents": 120000,
    "paid_at": "2026-06-12",
    "payment_method": "bank_transfer",
    "reference": "VIR-2026-05-99"
  }'`}
        />

        <div className="mt-4 rounded-xl border border-(--border) bg-(--muted)/30 p-4 text-xs">
          <p className="mb-2 font-semibold uppercase tracking-wider text-(--muted-foreground)">
            Body
          </p>
          <ul className="space-y-1.5">
            <li>
              <code>amount_cents</code> — optional, defaults to <code>total_cents</code>. If less,
              status becomes <code>partial</code>.
            </li>
            <li>
              <code>paid_at</code> — ISO date, defaults to today.
            </li>
            <li>
              <code>payment_method</code> — optional free string (e.g. <code>bank_transfer</code>,{' '}
              <code>card</code>, <code>cash</code>).
            </li>
            <li>
              <code>reference</code> — your internal transaction reference.
            </li>
          </ul>
        </div>

        <div className="mt-8 rounded-xl border border-(--border) bg-(--muted)/30 p-4">
          <p className="text-sm font-semibold">Coming in V1.1</p>
          <p className="mt-1 text-xs text-(--muted-foreground)">
            <code>POST /api/v2/invoices</code> (create), <code>PATCH /api/v2/invoices/:id</code>{' '}
            (update), <code>POST /api/v2/invoices/:id/send</code>,{' '}
            <code>GET /api/v2/invoices/:id/pdf</code>, <code>DELETE /api/v2/invoices/:id</code>.
            All routes are reserved and will preserve the same shape as the existing
            <code>{' '}/api/v2/invoices</code> response envelope.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Related webhooks</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-(--muted-foreground)">
          <li>
            <code>invoice.created</code>, <code>invoice.updated</code>, <code>invoice.deleted</code>
          </li>
          <li>
            <code>invoice.sent</code> — after a delivery succeeds
          </li>
          <li>
            <code>invoice.paid</code>, <code>invoice.partially_paid</code>,{' '}
            <code>invoice.overdue</code>
          </li>
        </ul>
      </section>
    </div>
  )
}
