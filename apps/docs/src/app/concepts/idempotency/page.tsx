import { API_PLATFORM_BASE_URL } from '@/lib/config'

export const metadata = { title: 'Idempotency · Faktur Developers' }

export default function IdempotencyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Concept</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Idempotency</h1>
      <p className="mt-4 text-(--muted-foreground)">
        Any POST, PUT, PATCH, or DELETE accepts a <code>Faktur-Idempotency-Key</code> header.
        When set, retrying the exact same request returns the original response without
        re-executing the mutation. Use this to safely retry across network failures.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <ol className="mt-3 space-y-2 text-sm text-(--muted-foreground)">
          <li>
            <strong className="text-(--foreground)">1.</strong> Generate a unique key (UUID v4
            recommended) on your side.
          </li>
          <li>
            <strong className="text-(--foreground)">2.</strong> Send it in the{' '}
            <code>Faktur-Idempotency-Key</code> header.
          </li>
          <li>
            <strong className="text-(--foreground)">3.</strong> Faktur hashes your request body
            and stores the response for 24 hours.
          </li>
          <li>
            <strong className="text-(--foreground)">4.</strong> A retry with the same key and
            same body replays the stored response (header{' '}
            <code>Faktur-Idempotency-Replay: true</code>).
          </li>
          <li>
            <strong className="text-(--foreground)">5.</strong> A retry with the same key but
            different body returns <code>409 idempotency_replay</code>.
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Example</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-(--border) bg-(--code-bg) p-4 text-xs leading-relaxed">
          <code>{`curl ${API_PLATFORM_BASE_URL}/clients \\
  -X POST \\
  -H "Authorization: Bearer fk_live_..." \\
  -H "Faktur-Idempotency-Key: 6f12b8c9-f3e1-4a91-bdaa-7f8c20a1ff34" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "company",
    "company_name": "ACME SAS",
    "email": "contact@acme.com"
  }'`}</code>
        </pre>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Rules &amp; limits</h2>
        <ul className="mt-3 space-y-2 text-sm text-(--muted-foreground)">
          <li>Keys are scoped per API key, collisions across keys are impossible.</li>
          <li>The body hash must match exactly. Whitespace and field order are ignored.</li>
          <li>TTL is 24 hours from first use. After that, the key is reusable.</li>
          <li>Successful responses (2xx) are stored. 4xx/5xx are not replayed.</li>
          <li>Maximum key length: 128 characters.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">When to use it</h2>
        <ul className="mt-3 space-y-2 text-sm text-(--muted-foreground)">
          <li>Webhook handlers that POST into Faktur, guarantees no duplicates.</li>
          <li>Cron jobs that might fire twice in rare cases.</li>
          <li>Mobile clients on flaky connections.</li>
          <li>Any retry loop where you can&apos;t tell if the previous attempt landed.</li>
        </ul>
      </section>
    </div>
  )
}
