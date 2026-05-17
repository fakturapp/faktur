import Link from 'next/link'
import { ArrowRight, Key, Send, Webhook } from 'lucide-react'
import { API_V2_BASE_URL, PLATFORM_URL } from '@/lib/config'

export const metadata = {
  title: 'Quickstart — Faktur Developers',
  description: 'Make your first Faktur API call in under 2 minutes.',
}

export default function Quickstart() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Quickstart</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">First call in 2 minutes</h1>
      <p className="mt-4 text-(--muted-foreground)">
        This guide walks you from zero to your first authenticated API call. You&apos;ll need a
        Faktur account with a team in <strong>Standard encryption mode</strong> — the API is not
        available in Private mode.
      </p>

      <Step number={1} title="Generate an API key" icon={Key}>
        <p>
          Open{' '}
          <Link
            href={`${PLATFORM_URL}/api-keys`}
            className="text-violet-500 underline-offset-2 hover:underline"
          >
            Settings → API & Webhooks
          </Link>{' '}
          in your Faktur account and click <strong>Create key</strong>. Pick a name, choose the{' '}
          <em>Read + write</em> preset, and finish the wizard.
        </p>
        <p className="mt-3">
          The key appears once and looks like <code>fk_live_…</code>. Copy it to a safe place — it
          cannot be retrieved again.
        </p>
      </Step>

      <Step number={2} title="Verify your credentials" icon={Send}>
        <p>
          The <code>/api/v2/ping</code> endpoint returns your authenticated identity, scopes, and
          rate limit tier.
        </p>
        <Code lang="bash">
          {`curl ${API_V2_BASE_URL}/ping \\
  -H "Authorization: Bearer fk_live_..."`}
        </Code>
        <p className="mt-3">Sample response:</p>
        <Code lang="json">
          {`{
  "data": {
    "api_version": "v2",
    "authenticated": true,
    "team": {
      "id": "tm_...",
      "name": "ACME SAS",
      "encryption_mode": "standard"
    },
    "api_key": {
      "id": "apk_...",
      "name": "Production",
      "scopes": ["invoices:read", "invoices:write", "clients:read", "clients:write"],
      "rate_limit_tier": "default"
    },
    "timestamp": "2026-05-16T14:32:11Z"
  }
}`}
        </Code>
      </Step>

      <Step number={3} title="Create a client" icon={ArrowRight}>
        <p>Create a client to attach future invoices to.</p>
        <Code lang="bash">
          {`curl ${API_V2_BASE_URL}/clients \\
  -X POST \\
  -H "Authorization: Bearer fk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "company",
    "company_name": "ACME SAS",
    "email": "contact@acme.com",
    "siren": "123456789"
  }'`}
        </Code>
        <p className="mt-3">
          Response includes a public ID like <code>clt_8KqL2x…</code>. Save it — you&apos;ll need it
          for the next step.
        </p>
      </Step>

      <Step number={4} title="Create an invoice" icon={Send}>
        <p>Use the <code>client_id</code> from step 3 to issue your first invoice.</p>
        <Code lang="bash">
          {`curl ${API_V2_BASE_URL}/invoices \\
  -X POST \\
  -H "Authorization: Bearer fk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "clt_8KqL2x...",
    "issue_date": "2026-05-16",
    "due_date": "2026-06-15",
    "lines": [
      {
        "description": "Development consulting",
        "quantity": 10,
        "unit_price_cents": 10000,
        "vat_rate": 20
      }
    ]
  }'`}
        </Code>
      </Step>

      <Step number={5} title="Listen to webhooks (optional)" icon={Webhook}>
        <p>
          Configure a webhook endpoint to receive events when invoices are sent, paid, or
          overdue. From the dashboard, go to your key&apos;s detail page → Webhook tab → enter
          your URL → select events → save.
        </p>
        <p className="mt-3">
          Every delivery is HMAC-SHA256 signed and includes anti-replay timestamps. See the{' '}
          <Link href="/concepts/webhooks" className="text-violet-500 hover:underline">
            webhooks guide
          </Link>{' '}
          for verification code.
        </p>
      </Step>

      <div className="mt-12 rounded-2xl border border-(--border) bg-(--muted)/40 p-6">
        <h2 className="text-lg font-semibold">Next steps</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            →{' '}
            <Link href="/resources/invoices" className="text-violet-500 hover:underline">
              Browse the full reference
            </Link>{' '}
            for every endpoint
          </li>
          <li>
            →{' '}
            <Link href="/concepts/authentication" className="text-violet-500 hover:underline">
              Authentication deep dive
            </Link>{' '}
            (scopes, IP allowlists, rotation)
          </li>
          <li>
            →{' '}
            <Link href="/recipes" className="text-violet-500 hover:underline">
              Recipes
            </Link>{' '}
            — auto-create invoices from Stripe, sync CRM, weekly reports
          </li>
          <li>
            →{' '}
            <Link href="/concepts/errors" className="text-violet-500 hover:underline">
              Error handling
            </Link>{' '}
            and the full code catalog
          </li>
        </ul>
      </div>
    </div>
  )
}

function Step({
  number,
  title,
  icon: Icon,
  children,
}: {
  number: number
  title: string
  icon: typeof Key
  children: React.ReactNode
}) {
  return (
    <section className="mt-10 border-l-2 border-violet-500/30 pl-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-violet-500/15 text-xs font-semibold text-violet-500">
          {number}
        </span>
        <h2 className="text-xl font-semibold">{title}</h2>
        <Icon className="size-4 text-(--muted-foreground)" />
      </div>
      <div className="mt-4 space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  )
}

function Code({ children, lang }: { children: string; lang: string }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-(--border) bg-(--code-bg)">
      <div className="flex items-center justify-between border-b border-(--border) bg-(--muted)/40 px-3 py-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-(--muted-foreground)">
          {lang}
        </span>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  )
}
