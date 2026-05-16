export const metadata = { title: 'Rate limits — Faktur Developers' }

export default function RateLimitsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Concept</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Rate limits</h1>
      <p className="mt-4 text-(--muted-foreground)">
        Faktur enforces two windows on each API key — per minute and per hour. Standard headers
        let you implement clean backoff.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Default tier</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-(--border) bg-(--muted)/40 p-4">
            <p className="text-xs uppercase tracking-wider text-(--muted-foreground)">
              Per minute
            </p>
            <p className="mt-1 text-2xl font-semibold">60</p>
          </div>
          <div className="rounded-xl border border-(--border) bg-(--muted)/40 p-4">
            <p className="text-xs uppercase tracking-wider text-(--muted-foreground)">
              Per hour
            </p>
            <p className="mt-1 text-2xl font-semibold">1 000</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-(--muted-foreground)">
          Higher tiers (Pro, Business, Unlimited) are available with paid plans.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Headers on every response</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-(--border) bg-(--code-bg) p-4 text-xs">
          <code>{`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1747401191
X-RateLimit-Policy: "60;w=60, 1000;w=3600"`}</code>
        </pre>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">429 response</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-(--border) bg-(--code-bg) p-4 text-xs">
          <code>{`HTTP/1.1 429 Too Many Requests
Retry-After: 18

{
  "error": {
    "code": "rate_limited",
    "message": "Rate limit exceeded. Try again in 18 seconds.",
    "details": {
      "limit": 60,
      "window": "1m",
      "reset_at": "2026-05-16T14:33:11Z"
    }
  }
}`}</code>
        </pre>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Operational quotas</h2>
        <p className="mt-3 text-sm text-(--muted-foreground)">
          Some endpoints have additional monthly quotas (PDF generation, email sending) tied to
          your team plan. Hitting one returns <code>quota_exceeded</code> with a{' '}
          <code>details.quota_type</code> field.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Recommended client behavior</h2>
        <ul className="mt-3 space-y-2 text-sm text-(--muted-foreground)">
          <li>
            Read <code>X-RateLimit-Remaining</code> on every response and slow down preemptively
            when it nears zero.
          </li>
          <li>
            On <code>429</code>, honor <code>Retry-After</code> exactly, then add a small jitter
            (±10%).
          </li>
          <li>
            Never burst all your tokens at once — spread requests over the window when possible.
          </li>
        </ul>
      </section>
    </div>
  )
}
