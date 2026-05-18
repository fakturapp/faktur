import Link from 'next/link'
import {
  ArrowRight,
  Lock,
  Zap,
  Webhook,
  Code2,
  ShieldCheck,
  Globe,
} from 'lucide-react'
import { CodeWindow } from '@/components/code-window'
import { API_PLATFORM_BASE_URL } from '@/lib/config'

export const dynamic = 'force-static'
export const revalidate = false

const FEATURES: Array<{
  icon: typeof Lock
  title: string
  description: string
}> = [
  {
    icon: Lock,
    title: 'Bearer tokens, scoped',
    description:
      'Personal API keys formatted resource:action. Rotate or revoke any time with IP allowlist support.',
  },
  {
    icon: Webhook,
    title: 'Signed webhooks',
    description:
      'HMAC-SHA256 signatures, anti-replay timestamps, 8-step retry policy with auto-disable on 410 Gone.',
  },
  {
    icon: Zap,
    title: 'Rate limit headers',
    description:
      'Standard X-RateLimit-Limit / -Remaining / -Reset on every response. Backoff cleanly with Retry-After.',
  },
  {
    icon: Globe,
    title: 'Cursor pagination',
    description:
      "Stable, no missed rows under concurrent writes. Same envelope on every collection.",
  },
  {
    icon: Code2,
    title: 'Idempotent POSTs',
    description:
      'Send Faktur-Idempotency-Key once and retry safely, network blips no longer produce duplicates.',
  },
  {
    icon: ShieldCheck,
    title: 'OpenAPI 3.1',
    description:
      'Generated spec served at /openapi.json. Import into Postman, Insomnia, or any SDK generator.',
  },
]

export default function Landing() {
  return (
    <div className="bg-background">
      <section className="relative overflow-hidden">
        <div className="docs-grid pointer-events-none absolute inset-0 -z-10" />
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28">
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            L&apos;API pour automatiser{' '}
            <span className="text-muted-foreground">votre facturation.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-balance text-[15px] text-muted-foreground sm:text-base">
            REST moderne pour factures, devis, clients, produits, dépenses et webhooks. Bearer
            tokens, scopes resource:action, cursor pagination, idempotency, pensé pour les
            développeurs qui scriptent leur propre compte ou intègrent Faktur dans un produit
            tiers.
          </p>

          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/quickstart"
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.02] active:scale-100"
            >
              Démarrer en 2 min
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/resources"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
            >
              Parcourir la référence
            </Link>
          </div>

          <div className="mt-12 w-full max-w-2xl">
            <CodeWindow filename="curl" className="text-left">
              {`curl ${API_PLATFORM_BASE_URL}/invoices \\
  -H "Authorization: Bearer fk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "clt_8KqL2x...",
    "issue_date": "2026-05-17",
    "due_date": "2026-06-15",
    "lines": [
      {
        "description": "Mission de conseil mai 2026",
        "quantity": 10,
        "unit_price_cents": 10000,
        "vat_rate": 20
      }
    ]
  }'`}
            </CodeWindow>
          </div>
        </div>
      </section>

      <section className="border-t border-separator">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Conçu pour la production
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Les bonnes conventions, dès le jour 1.
            </h2>
            <p className="mt-4 text-[15px] text-muted-foreground">
              Chaque endpoint suit les mêmes règles : enveloppe JSON cohérente, erreurs typées,
              cursor pagination, idempotency. Pas de surprise.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="flex flex-col gap-3 bg-background p-6 transition-colors hover:bg-surface"
                >
                  <div className="inline-flex size-8 items-center justify-center rounded-lg bg-accent-soft text-accent-soft-foreground">
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
                      {f.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-separator">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Référence complète
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Tout ce qu&apos;il faut pour automatiser la facturation.
              </h2>
              <ul className="mt-6 space-y-2.5 text-[14.5px] text-muted-foreground">
                {[
                  'Créer, envoyer, marquer payée une facture',
                  'Synchroniser clients et produits avec un CRM',
                  'Factures récurrentes, avoirs, dépenses',
                  'Soumission Chorus Pro via Factur-X',
                  'Webhooks signés HMAC pour réagir aux événements',
                  'Logs API et statistiques d’utilisation par clé',
                ].map((s) => (
                  <li key={s} className="flex items-start gap-2">
                    <span className="mt-2 inline-block size-1 shrink-0 rounded-full bg-accent" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex gap-3">
                <Link
                  href="/resources"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground transition-colors hover:bg-surface-hover"
                >
                  Parcourir les 15 ressources
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
            <div>
              <CodeWindow filename="node.ts">
                {`// Exemple Node, lister les factures payées du mois
import fetch from 'node-fetch'

const res = await fetch(
  '${API_PLATFORM_BASE_URL}/invoices?status=paid&limit=100',
  { headers: { Authorization: \`Bearer \${process.env.FAKTUR_KEY}\` } }
)
const { data, pagination } = await res.json()

let total = 0
for (const invoice of data) {
  total += invoice.total_cents
}
console.log('Revenu du mois :', total / 100, '€')

if (pagination.has_more) {
  // récupérer la page suivante avec pagination.next_cursor
}`}
              </CodeWindow>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-separator">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Prêt à shipper ?
          </h2>
          <p className="mt-4 text-[15px] text-muted-foreground">
            Génère une clé dans ton compte Faktur, fais ton premier appel en moins de deux minutes.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/quickstart"
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
            >
              Lancer le quickstart
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/openapi.json"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
            >
              Télécharger l&apos;OpenAPI 3.1
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
