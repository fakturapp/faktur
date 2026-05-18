import { EndpointBlock } from '@/components/endpoint-block'
import { API_V2_BASE_URL } from '@/lib/config'

export const metadata = { title: 'Expenses · Faktur API V2' }

export default function ExpensesReference() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">
        Reference / Resources
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Expenses</h1>
      <p className="mt-4 text-(--muted-foreground)">
        Track business expenses with VAT, receipts, and deductibility. Perfect target for OCR
        automations that feed receipts from your scanner into Faktur.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Object shape</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-(--border) bg-(--code-bg) p-4 text-xs leading-relaxed">
          <code>{`{
  "id": "exp_8KqL2x...",
  "description": "Office supplies",
  "supplier": "Bureau Vallée",
  "category_id": null,
  "amount_cents": 8499,
  "vat_amount_cents": 1700,
  "vat_rate": 20,
  "currency": "EUR",
  "expense_date": "2026-05-15",
  "payment_method": "card",
  "receipt_url": null,
  "is_deductible": true,
  "notes": null,
  "created_at": "2026-05-16T14:32:11Z",
  "updated_at": null
}`}</code>
        </pre>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Endpoints</h2>

        <EndpointBlock
          method="GET"
          path="/api/v2/expenses"
          scope="expenses:read"
          description="List expenses. Supports date ranges, deductible-only filter, and sorting by created_at or expense_date."
          example={`curl '${API_V2_BASE_URL}/expenses?date_after=2026-01-01&deductible_only=true' \\
  -H "Authorization: Bearer fk_live_..."`}
        />

        <EndpointBlock
          method="GET"
          path="/api/v2/expenses/:id"
          scope="expenses:read"
          description="Retrieve a single expense."
        />

        <EndpointBlock
          method="POST"
          path="/api/v2/expenses"
          scope="expenses:write"
          description="Record a new expense, vat_amount_cents is auto-computed from amount_cents and vat_rate if omitted."
          example={`curl ${API_V2_BASE_URL}/expenses \\
  -X POST \\
  -H "Authorization: Bearer fk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "description": "Office supplies",
    "supplier": "Bureau Vallée",
    "amount_cents": 8499,
    "vat_rate": 20,
    "expense_date": "2026-05-15",
    "payment_method": "card",
    "is_deductible": true
  }'`}
        />

        <EndpointBlock
          method="DELETE"
          path="/api/v2/expenses/:id"
          scope="expenses:delete"
          description="Delete an expense. Triggers expense.deleted webhook."
        />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Related webhooks</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-(--muted-foreground)">
          <li>
            <code>expense.created</code> · <code>expense.updated</code> ·{' '}
            <code>expense.deleted</code>
          </li>
        </ul>
      </section>
    </div>
  )
}
