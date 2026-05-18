export const metadata = { title: 'Rate limits & quotas · Faktur Developers' }

export default function RateLimitsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Concept</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Rate limits & quotas</h1>
      <p className="mt-4 text-(--muted-foreground)">
        Faktur applies three independent windows on each API key, evaluated per team. The most
        restrictive one wins.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Limits at a glance</h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-(--border) bg-(--muted)/40 p-4">
            <p className="text-xs uppercase tracking-wider text-(--muted-foreground)">
              Burst (per minute)
            </p>
            <p className="mt-1 text-2xl font-semibold">3</p>
            <p className="mt-1 text-xs text-(--muted-foreground)">anti-abuse, hard cap</p>
          </div>
          <div className="rounded-xl border border-(--border) bg-(--muted)/40 p-4">
            <p className="text-xs uppercase tracking-wider text-(--muted-foreground)">
              Session (5 h rolling)
            </p>
            <p className="mt-1 text-2xl font-semibold">100</p>
            <p className="mt-1 text-xs text-(--muted-foreground)">starts on first request</p>
          </div>
          <div className="rounded-xl border border-(--border) bg-(--muted)/40 p-4">
            <p className="text-xs uppercase tracking-wider text-(--muted-foreground)">
              Weekly (7 d rolling)
            </p>
            <p className="mt-1 text-2xl font-semibold">1 000</p>
            <p className="mt-1 text-xs text-(--muted-foreground)">starts on first request</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-(--muted-foreground)">
          Both rolling windows start at the first authenticated request and reset only after the
          configured duration has elapsed since that start. Paid plans (Pro, Business) will lift
          the session and weekly limits later, plus add a pay-as-you-go option.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">What does not count</h2>
        <p className="mt-3 text-sm">
          Meta endpoints under <code>/api/platform/*</code> are free and never decrement a
          counter:
        </p>
        <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-(--muted-foreground)">
          <li>
            <code>GET /api/platform/ping</code>: identity probe
          </li>
          <li>
            <code>GET /api/platform/session</code>: current session, weekly and per-minute
            counters
          </li>
          <li>
            <code>GET /api/platform/usage</code>: full usage payload including team and key
            metadata
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Headers on every response</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-(--border) bg-(--code-bg) p-4 text-xs">
          <code>{`X-Credits-Session-Limit: 100
X-Credits-Session-Window-Hours: 5
X-Credits-Session-Remaining: 87
X-Credits-Weekly-Limit: 1000
X-Credits-Weekly-Remaining: 612
X-Credits-Per-Minute-Limit: 3
X-Credits-Minute-Remaining: 2`}</code>
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
    "message": "Rate limit exceeded",
    "details": {
      "reason": "rate_limit_minute",
      "retry_after_seconds": 18,
      "limits": {
        "per_minute": 3,
        "per_session": 100,
        "session_hours": 5,
        "per_week": 1000
      }
    }
  }
}`}</code>
        </pre>
        <p className="mt-3 text-sm text-(--muted-foreground)">
          The <code>reason</code> tells you which window blocked the call:{' '}
          <code>rate_limit_minute</code>, <code>quota_session</code>, or{' '}
          <code>quota_weekly</code>.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Recommended client behaviour</h2>
        <ul className="mt-3 space-y-2 text-sm text-(--muted-foreground)">
          <li>
            Hit <code>GET /api/platform/usage</code> once at startup to know your remaining
            budget. It is free and gives the exact reset timestamps.
          </li>
          <li>
            Read <code>X-Credits-Session-Remaining</code> and slow down preemptively before
            hitting zero.
          </li>
          <li>
            On <code>429</code>, honour <code>Retry-After</code> exactly, then add a small jitter
            (±10%).
          </li>
          <li>
            Spread requests across the 5 h window. A burst of 60 calls in the first minute is
            fine, 60 calls in 20 s will trip the per-minute cap.
          </li>
        </ul>
      </section>
    </div>
  )
}
