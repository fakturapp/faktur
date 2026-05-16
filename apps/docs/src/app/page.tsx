'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Zap,
  Lock,
  Webhook,
  Code,
  Sparkles,
  CheckCircle2,
  Globe,
} from 'lucide-react'

export default function Landing() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-(--border)">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 size-[800px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 size-[400px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        </div>
        <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-(--border) bg-(--muted) px-3 py-1 text-xs">
              <span className="rounded-full bg-violet-500/15 px-1.5 py-0.5 font-semibold text-violet-500">
                NEW
              </span>
              Faktur API V2 is live in beta
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
              Automate <span className="gradient-text">Faktur</span>
              <br />
              from any language.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-(--muted-foreground)">
              A modern REST API for invoices, quotes, clients, products, and webhooks. Built for
              developers who want to script their own Faktur account or build third-party
              integrations.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/quickstart"
                className="inline-flex items-center gap-1.5 rounded-lg bg-(--foreground) px-5 py-2.5 text-sm font-medium text-(--background) transition-transform hover:scale-105"
              >
                Quickstart <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/resources/invoices"
                className="inline-flex items-center gap-1.5 rounded-lg border border-(--border) bg-(--muted) px-5 py-2.5 text-sm font-medium transition-colors hover:bg-(--background)"
              >
                Browse reference
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="gradient-border mt-16 overflow-hidden rounded-2xl"
          >
            <pre className="overflow-x-auto rounded-2xl border border-(--border) bg-(--code-bg) p-5 text-sm leading-relaxed">
              <code>
                <span className="text-(--muted-foreground)"># Create an invoice</span>
                {'\n'}
                <span className="text-violet-400">curl</span> https://api.fakturapp.cc/api/v2/invoices \
                {'\n  '}-H{' '}
                <span className="text-emerald-400">
                  &quot;Authorization: Bearer fk_live_…&quot;
                </span>{' '}
                \
                {'\n  '}-H{' '}
                <span className="text-emerald-400">
                  &quot;Content-Type: application/json&quot;
                </span>{' '}
                \
                {'\n  '}-d{' '}
                <span className="text-amber-400">
                  &apos;{`{
    "client_id": "clt_8KqL2x…",
    "issue_date": "2026-05-16",
    "due_date": "2026-06-15",
    "lines": [
      {
        "description": "Development",
        "quantity": 10,
        "unit_price_cents": 10000,
        "vat_rate": 20
      }
    ]
  }`}&apos;
                </span>
              </code>
            </pre>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          Built for production
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-(--muted-foreground)">
          Every endpoint follows the same conventions: clean JSON, cursor pagination, predictable
          errors, idempotency.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={Lock}
            title="Bearer tokens with scopes"
            description="Personal API keys scoped per resource:action. Rotate or revoke any time, with IP allowlists for production keys."
            accent="from-violet-500 to-fuchsia-500"
          />
          <FeatureCard
            icon={Webhook}
            title="Signed webhooks"
            description="HMAC-SHA256 signatures, anti-replay, retry with exponential backoff. Test deliveries from the dashboard."
            accent="from-cyan-500 to-blue-500"
          />
          <FeatureCard
            icon={Zap}
            title="Rate limits with headers"
            description="Standard X-RateLimit-* headers. Tiered limits aligned with your Faktur plan, with clear 429 responses."
            accent="from-amber-500 to-orange-500"
          />
          <FeatureCard
            icon={Globe}
            title="Cursor pagination"
            description="Stable, scalable pagination that doesn't lose results when data changes. Same shape on every collection."
            accent="from-emerald-500 to-teal-500"
          />
          <FeatureCard
            icon={Code}
            title="Idempotent POSTs"
            description="Send `Faktur-Idempotency-Key` with any mutation and replay safely. Network blips no longer create duplicates."
            accent="from-rose-500 to-pink-500"
          />
          <FeatureCard
            icon={Sparkles}
            title="OpenAPI 3.1 generated"
            description="The spec is generated from the live code — never out of sync. Import it into Postman, Insomnia, or any SDK generator."
            accent="from-indigo-500 to-violet-500"
          />
        </div>
      </section>

      <section className="border-t border-(--border) bg-(--muted)/50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Everything you need to automate billing.
              </h2>
              <p className="mt-4 text-(--muted-foreground)">
                17 resources. 30+ webhook events. Predictable behavior. The same engine that powers
                fakturapp.cc — exposed cleanly to your code.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {[
                  'Create, send, mark-paid invoices and quotes',
                  'Sync clients and products from your CRM',
                  'Recurring invoices, credit notes, expenses',
                  'Submit invoices to Chorus Pro via Factur-X',
                  'Listen to webhook events with HMAC verification',
                  'Stream API logs and usage stats',
                ].map((s) => (
                  <li key={s} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-violet-500" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex gap-3">
                <Link
                  href="/resources/invoices"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-(--border) bg-(--background) px-4 py-2 text-sm transition-colors hover:bg-(--muted)"
                >
                  Browse 17 resources <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
            <div className="gradient-border rounded-2xl">
              <pre className="overflow-x-auto rounded-2xl border border-(--border) bg-(--code-bg) p-5 text-xs leading-relaxed">
                <code>{`// node example: list paid invoices
import fetch from 'node-fetch'

const res = await fetch(
  'https://api.fakturapp.cc/api/v2/invoices?status=paid&limit=50',
  { headers: { Authorization: \`Bearer \${process.env.FAKTUR_KEY}\` } }
)
const { data, pagination } = await res.json()

for (const invoice of data) {
  console.log(invoice.number, invoice.total_cents)
}

if (pagination.has_more) {
  // fetch next page using pagination.next_cursor
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Ready to ship?</h2>
        <p className="mt-4 text-(--muted-foreground)">
          Generate a key in your Faktur account and make your first call in under two minutes.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/quickstart"
            className="inline-flex items-center gap-1.5 rounded-lg bg-(--foreground) px-5 py-2.5 text-sm font-medium text-(--background) transition-transform hover:scale-105"
          >
            Start the quickstart <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  accent,
}: {
  icon: typeof Zap
  title: string
  description: string
  accent: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="gradient-border group rounded-2xl border border-(--border) bg-(--background) p-6 transition-transform hover:-translate-y-1"
    >
      <div
        className={`inline-flex size-9 items-center justify-center rounded-lg bg-gradient-to-br ${accent} text-white shadow-lg shadow-black/10`}
      >
        <Icon className="size-4" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-(--muted-foreground)">{description}</p>
    </motion.div>
  )
}
