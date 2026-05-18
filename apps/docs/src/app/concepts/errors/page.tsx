import { DOCS_URL } from '@/lib/config'

export const metadata = { title: 'Errors · Faktur Developers' }

const errors = [
  { code: 'invalid_token', http: 401, when: 'Missing, malformed, or unknown API key' },
  { code: 'token_expired', http: 401, when: 'Key past its expires_at date' },
  { code: 'token_revoked', http: 401, when: 'Key was revoked manually or auto' },
  { code: 'ip_not_allowed', http: 403, when: 'Source IP not in the allowlist' },
  { code: 'insufficient_scope', http: 403, when: 'Required scope missing from the key' },
  { code: 'team_mode_private', http: 403, when: 'Team uses Private encryption mode' },
  { code: 'team_inactive', http: 403, when: 'Team is suspended' },
  { code: 'resource_not_found', http: 404, when: 'ID unknown or owned by another team' },
  { code: 'route_not_found', http: 404, when: 'No endpoint matches the request' },
  { code: 'method_not_allowed', http: 405, when: 'Verb not supported on this endpoint' },
  { code: 'conflict', http: 409, when: 'State mismatch (e.g, paying an already-paid invoice)' },
  { code: 'idempotency_replay', http: 409, when: 'Idempotency key reused with a different body' },
  { code: 'validation_failed', http: 422, when: 'Validation errors, see details[]' },
  {
    code: 'business_rule_violation',
    http: 422,
    when: 'Logical rule broken (e.g, deleting a sent invoice)',
  },
  { code: 'rate_limited', http: 429, when: 'Per-minute or per-hour window exhausted' },
  { code: 'quota_exceeded', http: 429, when: 'Monthly quota (PDF, emails, etc.) reached' },
  { code: 'internal_error', http: 500, when: 'Server bug, include request_id in support tickets' },
  { code: 'service_unavailable', http: 503, when: 'Maintenance or downstream outage' },
]

export default function ErrorsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Concept</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Errors</h1>
      <p className="mt-4 text-(--muted-foreground)">
        Every failed request returns a JSON object with a stable <code>code</code>, a human
        message, a <code>request_id</code> for support, and a documentation URL.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Response shape</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-(--border) bg-(--code-bg) p-4 text-xs leading-relaxed">
          <code>{`{
  "error": {
    "code": "validation_failed",
    "message": "Some fields are invalid",
    "request_id": "req_8KqL2x...",
    "doc_url": "${DOCS_URL}/concepts/errors#validation_failed",
    "details": [
      { "field": "lines[0].unit_price_cents", "code": "required" },
      { "field": "due_date", "code": "invalid_format" }
    ]
  }
}`}</code>
        </pre>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Error catalog</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-(--border)">
          <table className="w-full text-sm">
            <thead className="bg-(--muted)/40">
              <tr className="text-left">
                <th className="px-3 py-2 text-xs uppercase tracking-wider text-(--muted-foreground)">
                  Code
                </th>
                <th className="px-3 py-2 text-xs uppercase tracking-wider text-(--muted-foreground)">
                  HTTP
                </th>
                <th className="px-3 py-2 text-xs uppercase tracking-wider text-(--muted-foreground)">
                  When
                </th>
              </tr>
            </thead>
            <tbody>
              {errors.map((e) => (
                <tr
                  key={e.code}
                  id={e.code}
                  className="scroll-mt-24 border-t border-(--border)"
                >
                  <td className="px-3 py-2.5 font-mono text-xs">{e.code}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{e.http}</td>
                  <td className="px-3 py-2.5 text-(--muted-foreground)">{e.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Retry strategy</h2>
        <ul className="mt-3 space-y-2 text-sm text-(--muted-foreground)">
          <li>
            <strong className="text-(--foreground)">401 / 403</strong>, fix credentials, do not
            retry automatically.
          </li>
          <li>
            <strong className="text-(--foreground)">422 / 409</strong>, fix the request payload,
            no retry.
          </li>
          <li>
            <strong className="text-(--foreground)">429</strong>, respect{' '}
            <code>Retry-After</code> and back off exponentially.
          </li>
          <li>
            <strong className="text-(--foreground)">5xx</strong>, retry up to 3 times with
            jittered exponential backoff (1s, 2s, 4s).
          </li>
        </ul>
      </section>
    </div>
  )
}
