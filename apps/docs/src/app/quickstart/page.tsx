import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  ChevronRight,
  CodeXml,
  Compass,
  Key,
  ShieldCheck,
  Sparkles,
  Webhook,
} from 'lucide-react'
import { API_PLATFORM_BASE_URL, PLATFORM_URL } from '@/lib/config'
import { Safari } from '@/components/safari-mockup'
import { CodeBlock } from '@/components/code-block'

export const metadata = {
  title: 'Quickstart · Faktur Developers',
  description: 'Make your first Faktur API call in under 2 minutes.',
}

export default function Quickstart() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Quickstart</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">First call in 2 minutes</h1>
      <p className="mt-4 text-(--muted-foreground)">
        Bienvenue. Ce guide t&apos;amène de zéro à ton premier appel API authentifié. Tu vas
        générer une clé, vérifier ton identité, créer un client, puis émettre une facture. Tout se
        fait en 5 étapes, sans installer de SDK.
      </p>

      <Callout tone="warning" icon={AlertTriangle} title="Mode de chiffrement">
        L&apos;API publique fonctionne uniquement avec une équipe en{' '}
        <strong>chiffrement Standard</strong>. Si ton équipe est en mode Privé, l&apos;accès est
        intentionnellement bloqué côté serveur car la DEK n&apos;est jamais déchiffrable sans ton
        mot de passe. Bascule en mode Standard depuis les paramètres de ton équipe pour
        continuer.
      </Callout>

      <Step number={1} title="Générer une clé API" accent="violet" icon={Key}>
        <p>
          Ouvre la{' '}
          <Link
            href={`${PLATFORM_URL}/projects`}
            className="text-violet-500 underline-offset-2 hover:underline"
          >
            plateforme développeur Faktur
          </Link>
          , sélectionne ton projet, puis clique sur <strong>Nouvelle clé</strong>. Donne lui un
          nom parlant comme <code>Production Zapier</code>, choisis un préréglage
          (Lecture seule, Accès complet, ou Personnalisé), puis valide.
        </p>
        <p>
          La clé apparaît une seule fois sous la forme <code>fk_live_…</code>. Copie la dans un
          gestionnaire de secrets immédiatement. Si tu la perds, tu peux la réinitialiser depuis
          la page Paramètres de la clé. Aucune action ne peut la récupérer telle quelle.
        </p>

        <BrowserPreview url="platform.fakturapp.cc/projects/prj_…/api-keys">
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-500">
              <Key className="size-5" />
            </span>
            <p className="text-sm font-semibold text-(--foreground)">Production Zapier</p>
            <code className="rounded-md border border-(--border) bg-(--code-bg) px-3 py-1.5 font-mono text-xs text-(--muted-foreground)">
              fk_live_•••••••••••••••AoOY
            </code>
            <p className="max-w-md text-xs text-(--muted-foreground)">
              4 permissions accordées. Active. Aucune restriction IP.
            </p>
          </div>
        </BrowserPreview>
      </Step>

      <Step number={2} title="Vérifier tes identifiants" accent="indigo" icon={ShieldCheck}>
        <p>
          L&apos;endpoint <code>/api/platform/ping</code> retourne ton identité, tes scopes et ton
          tier de rate limit. C&apos;est l&apos;endpoint le plus rapide pour confirmer que ta
          clé fonctionne avant de passer à la production.
        </p>
        <CodeBlock lang="bash">
          {`curl ${API_PLATFORM_BASE_URL}/ping \\
  -H "Authorization: Bearer fk_live_..."`}
        </CodeBlock>
        <p>Réponse type :</p>
        <CodeBlock lang="json">
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
        </CodeBlock>
      </Step>

      <Step number={3} title="Créer un client" accent="sky" icon={ArrowRight}>
        <p>
          Tu ne peux pas émettre de facture sans client associé. Voici une création minimale
          pour une société française avec son SIREN.
        </p>
        <CodeBlock lang="bash">
          {`curl ${API_PLATFORM_BASE_URL}/clients \\
  -X POST \\
  -H "Authorization: Bearer fk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "company",
    "company_name": "ACME SAS",
    "email": "contact@acme.com",
    "siren": "123456789"
  }'`}
        </CodeBlock>
        <p>
          La réponse contient un ID public stable comme <code>clt_8KqL2x…</code>. Conserve le, tu
          en auras besoin à l&apos;étape suivante pour rattacher la facture.
        </p>
      </Step>

      <Step number={4} title="Émettre ta première facture" accent="emerald" icon={CodeXml}>
        <p>
          Reprends le <code>client_id</code> obtenu à l&apos;étape 3 et émets une facture avec
          une ligne unique. Les montants sont en centimes, la TVA en pourcentage.
        </p>
        <CodeBlock lang="bash">
          {`curl ${API_PLATFORM_BASE_URL}/invoices \\
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
        </CodeBlock>
        <p>
          Faktur calcule automatiquement les totaux HT, TVA et TTC. La facture sort en statut
          brouillon. Pour la finaliser et déclencher l&apos;envoi par email au client, appelle
          ensuite <code>POST /invoices/:id/finalize</code>.
        </p>
      </Step>

      <Step number={5} title="Écouter les webhooks (optionnel)" accent="amber" icon={Webhook}>
        <p>
          Pour réagir en temps réel aux événements (facture envoyée, payée, en retard),
          configure un webhook sur ta clé. Depuis la plateforme, ouvre la page de ta clé puis
          l&apos;onglet <strong>Webhook</strong>. Saisis l&apos;URL HTTPS de ton endpoint,
          choisis les événements avec le sélecteur Stripe-style, puis enregistre.
        </p>
        <p>
          Chaque livraison est signée en HMAC-SHA256 avec ton secret et inclut un horodatage
          anti-rejeu. Tu peux personnaliser le nombre de tentatives, le timeout, le backoff
          et les en-têtes HTTP custom depuis la section{' '}
          <em>Configuration de livraison</em>. Voir le guide{' '}
          <Link href="/concepts/webhooks" className="text-violet-500 hover:underline">
            Webhooks
          </Link>{' '}
          pour le code de vérification de signature.
        </p>
      </Step>

      <h2 id="next-steps" className="mt-16 text-2xl font-semibold tracking-tight">
        Et après ?
      </h2>
      <p className="mt-2 text-(--muted-foreground)">
        Tu as les fondations. Voici les guides à parcourir maintenant pour aller plus loin.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <NextStepCard
          href="/resources/invoices"
          icon={BookOpen}
          title="Référence API complète"
          description="Chaque endpoint, chaque champ, chaque code d'erreur."
          tone="violet"
        />
        <NextStepCard
          href="/concepts/authentication"
          icon={ShieldCheck}
          title="Authentification en profondeur"
          description="Scopes, restrictions IP, rotation, clés de grâce."
          tone="indigo"
        />
        <NextStepCard
          href="/recipes"
          icon={Sparkles}
          title="Recettes"
          description="Sync Stripe vers Faktur, exports CRM, rapports hebdo."
          tone="emerald"
        />
        <NextStepCard
          href="/concepts/errors"
          icon={Compass}
          title="Gestion des erreurs"
          description="Catalogue complet des codes et stratégies de retry."
          tone="amber"
        />
      </div>
    </div>
  )
}

type Accent = 'violet' | 'indigo' | 'sky' | 'emerald' | 'amber'

const ACCENT_CLASSES: Record<
  Accent,
  { border: string; badge: string; badgeText: string; line: string }
> = {
  violet: {
    border: 'border-violet-500/30',
    badge: 'bg-violet-500/15',
    badgeText: 'text-violet-500',
    line: 'bg-violet-500/30',
  },
  indigo: {
    border: 'border-indigo-500/30',
    badge: 'bg-indigo-500/15',
    badgeText: 'text-indigo-500',
    line: 'bg-indigo-500/30',
  },
  sky: {
    border: 'border-sky-500/30',
    badge: 'bg-sky-500/15',
    badgeText: 'text-sky-500',
    line: 'bg-sky-500/30',
  },
  emerald: {
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/15',
    badgeText: 'text-emerald-500',
    line: 'bg-emerald-500/30',
  },
  amber: {
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/15',
    badgeText: 'text-amber-500',
    line: 'bg-amber-500/30',
  },
}

function Step({
  number,
  title,
  icon: Icon,
  accent = 'violet',
  children,
}: {
  number: number
  title: string
  icon: typeof Key
  accent?: Accent
  children: React.ReactNode
}) {
  const acc = ACCENT_CLASSES[accent]
  return (
    <section className="relative mt-14 grid grid-cols-[3rem_1fr] gap-x-5">
      <div className="relative row-span-2 flex flex-col items-center">
        <span
          className={`relative z-10 inline-flex size-12 shrink-0 items-center justify-center rounded-2xl ring-4 ring-(--background) ${acc.badge} ${acc.badgeText}`}
        >
          <Icon className="size-6" strokeWidth={2.25} />
        </span>
        <span aria-hidden className={`mt-1 w-px flex-1 ${acc.line}`} />
      </div>
      <div>
        <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${acc.badgeText}`}>
          Étape {number}
        </p>
        <h2 className="m-0 mt-1 text-2xl font-semibold tracking-tight leading-tight">{title}</h2>
      </div>
      <div className="pb-2 pt-4 space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  )
}

function Callout({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: 'warning' | 'info'
  icon: typeof Key
  title: string
  children: React.ReactNode
}) {
  const styles =
    tone === 'warning'
      ? 'border-amber-500/30 bg-amber-500/5'
      : 'border-sky-500/30 bg-sky-500/5'
  const iconColor = tone === 'warning' ? 'text-amber-500' : 'text-sky-500'
  return (
    <div className={`mt-6 rounded-xl border ${styles} p-4`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 inline-flex size-5 shrink-0 items-center justify-center ${iconColor}`}>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-(--foreground)">{title}</p>
          <div className="mt-1 text-sm text-(--muted-foreground)">{children}</div>
        </div>
      </div>
    </div>
  )
}

function BrowserPreview({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-(--border) bg-(--muted)/20">
      <Safari url={url} width={1203} height={400} className="block h-auto w-full" />
      <div className="-mt-[348px] mb-4 px-1">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl bg-(--background) shadow-sm ring-1 ring-(--border)">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

const TONE_CARDS: Record<
  Accent,
  { iconBg: string; iconText: string; hover: string }
> = {
  violet: {
    iconBg: 'bg-violet-500/15',
    iconText: 'text-violet-500',
    hover: 'hover:border-violet-500/50 hover:bg-violet-500/5',
  },
  indigo: {
    iconBg: 'bg-indigo-500/15',
    iconText: 'text-indigo-500',
    hover: 'hover:border-indigo-500/50 hover:bg-indigo-500/5',
  },
  sky: {
    iconBg: 'bg-sky-500/15',
    iconText: 'text-sky-500',
    hover: 'hover:border-sky-500/50 hover:bg-sky-500/5',
  },
  emerald: {
    iconBg: 'bg-emerald-500/15',
    iconText: 'text-emerald-500',
    hover: 'hover:border-emerald-500/50 hover:bg-emerald-500/5',
  },
  amber: {
    iconBg: 'bg-amber-500/15',
    iconText: 'text-amber-500',
    hover: 'hover:border-amber-500/50 hover:bg-amber-500/5',
  },
}

function NextStepCard({
  href,
  icon: Icon,
  title,
  description,
  tone,
}: {
  href: string
  icon: typeof Key
  title: string
  description: string
  tone: Accent
}) {
  const t = TONE_CARDS[tone]
  return (
    <Link
      href={href}
      className={`group relative flex items-start gap-3 rounded-xl border border-(--border) bg-(--background) p-4 transition-colors ${t.hover}`}
    >
      <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg ${t.iconBg} ${t.iconText}`}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-(--foreground)">{title}</p>
        <p className="mt-0.5 text-xs text-(--muted-foreground)">{description}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-(--muted-foreground) transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
