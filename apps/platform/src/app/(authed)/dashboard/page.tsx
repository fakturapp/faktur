'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  Book,
  Folder,
  Gauge,
  Key,
  Plus,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { useProjects } from '@/lib/projects-context'
import { DOCS_URL } from '@/lib/oauth-config'
import { apiKeysClient, type ApiKeyShape } from '@/lib/api-keys-client'
import { creditsClient, type CreditsUsage } from '@/lib/credits-client'

function formatRelative(iso: string | null): string {
  if (!iso) return 'jamais utilisée'
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffSec = Math.max(0, Math.floor((now - then) / 1000))
  if (diffSec < 60) return `il y a ${diffSec}s`
  const m = Math.floor(diffSec / 60)
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  if (d < 30) return `il y a ${d} j`
  return new Date(iso).toLocaleDateString()
}

function fmtCompact(iso: string | null): string {
  if (!iso) return '—'
  const target = new Date(iso).getTime()
  const diff = Math.max(0, Math.floor((target - Date.now()) / 1000))
  if (diff <= 0) return 'maintenant'
  const d = Math.floor(diff / 86400)
  const h = Math.floor((diff % 86400) / 3600)
  const m = Math.floor((diff % 3600) / 60)
  if (d > 0) return `${d}j ${h}h${m.toString().padStart(2, '0')}m`
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}m`
  if (m > 0) return `${m}m`
  return `${diff}s`
}

function firstName(user: { fullName: string | null; email: string } | null): string {
  if (!user) return ''
  if (user.fullName) {
    const first = user.fullName.trim().split(/\s+/)[0]
    if (first) return first
  }
  return user.email.split('@')[0]
}

export default function DashboardHomePage() {
  const { user } = useAuth()
  const { projects } = useProjects()
  const [recentKeys, setRecentKeys] = useState<ApiKeyShape[] | null>(null)
  const [usage, setUsage] = useState<CreditsUsage | null>(null)

  useEffect(() => {
    apiKeysClient.recentlyUsed(5).then((res) => {
      if (res.data?.data) setRecentKeys(res.data.data)
      else setRecentKeys([])
    })
    creditsClient.usage().then((res) => {
      if (res.data?.data) setUsage(res.data.data)
    })
  }, [])

  const activeProjects = (projects ?? []).filter((p) => !p.is_archived)
  const recentProjects = activeProjects.slice(0, 5)

  const sessionPct = usage
    ? Math.round((usage.session.used / usage.session.limit) * 100)
    : 0
  const weeklyPct = usage
    ? Math.round((usage.weekly.used / usage.weekly.limit) * 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 px-4 lg:px-6 pt-16 md:pt-20 pb-12 max-w-5xl mx-auto w-full"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Bonjour, {firstName(user) || 'développeur'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Voici un aperçu de votre utilisation de l&apos;API Faktur.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/projects" className="block">
          <Card className="border-border/50 transition-colors hover:border-accent/40 hover:bg-surface-hover">
            <CardContent className="p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Folder className="h-4 w-4" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                Gérer mes projets
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Créer, organiser, archiver
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/usage" className="block">
          <Card className="border-border/50 transition-colors hover:border-accent/40 hover:bg-surface-hover">
            <CardContent className="p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Activity className="h-4 w-4" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">Usage</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Quotas, sessions, hebdo
              </p>
            </CardContent>
          </Card>
        </Link>

        <a href={DOCS_URL} target="_blank" rel="noreferrer" className="block">
          <Card className="border-border/50 transition-colors hover:border-accent/40 hover:bg-surface-hover">
            <CardContent className="p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Book className="h-4 w-4" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                Documentation
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Endpoints, exemples, SDKs
              </p>
            </CardContent>
          </Card>
        </a>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Usage en ce moment
          </h2>
          <Link
            href="/usage"
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            Voir tout
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-5 space-y-6">
            <UsageLine
              label="Tous les appels API"
              subtitle={
                usage?.session.active
                  ? `réinitialise dans ${fmtCompact(usage.session.reset_at)}`
                  : 'Démarre dès ta première requête'
              }
              pct={sessionPct}
              loaded={usage !== null}
            />
            <UsageLine
              label="Limite hebdomadaire"
              subtitle={
                usage?.weekly.active
                  ? `réinitialise dans ${fmtCompact(usage.weekly.reset_at)}`
                  : 'Démarre dès ta première requête'
              }
              pct={weeklyPct}
              loaded={usage !== null}
            />
            <div className="flex items-center justify-between border-t border-border/40 pt-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5" />
                Burst protection {usage?.per_minute.limit ?? 3} req/min
              </span>
              <span className="italic">Crédits payants arrivent bientôt</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Clés récemment utilisées
          </h2>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            Voir tout
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-0">
            {recentKeys === null ? (
              <div className="px-5 py-8 text-center text-xs text-muted-foreground">
                Chargement…
              </div>
            ) : recentKeys.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Key className="mx-auto h-7 w-7 text-muted-foreground/40" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  Aucune utilisation récente
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Les clés apparaîtront ici dès le premier appel API.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentKeys.map((k) => (
                  <Link
                    key={k.id}
                    href={`/projects/${k.project_id}/keys/${k.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-hover transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{k.name}</p>
                      <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                        {k.masked_token}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatRelative(k.last_used_at)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Projets récents
          </h2>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            Voir tout
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-0">
            {activeProjects.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Folder className="mx-auto h-7 w-7 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-foreground font-medium">Aucun projet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Créez votre premier projet pour commencer.
                </p>
                <Link href="/projects" className="inline-block">
                  <Button size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau projet
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-hover transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {p.name}
                      </p>
                      {p.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground truncate">
                          {p.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Key className="h-3 w-3" />
                      {p.keys_count ?? 0}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

function UsageLine({
  label,
  subtitle,
  pct,
  loaded,
}: {
  label: string
  subtitle: string
  pct: number
  loaded: boolean
}) {
  const pctClamped = Math.min(100, Math.max(0, pct))
  const tone = pct >= 90 ? 'bg-danger' : pct >= 70 ? 'bg-warning' : 'bg-accent'
  return (
    <div className="flex w-full flex-row flex-wrap items-center justify-between gap-x-8 gap-y-2">
      <div className="flex w-52 shrink-0 flex-col gap-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{subtitle}</span>
      </div>
      <div className="flex flex-1 items-center gap-4 pl-6 md:max-w-xl">
        <div className="min-w-[160px] flex-1">
          <div
            className="relative h-2 w-full overflow-hidden rounded-full bg-surface"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pctClamped}
            aria-label={label}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${tone}`}
              style={{ width: `${Math.max(1, pctClamped)}%` }}
            />
          </div>
        </div>
        <span className="min-w-[3rem] whitespace-nowrap text-right text-base font-semibold text-foreground tabular-nums">
          {loaded ? `${pct}%` : '—'}
        </span>
      </div>
    </div>
  )
}
