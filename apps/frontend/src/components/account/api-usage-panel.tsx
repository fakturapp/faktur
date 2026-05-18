'use client'

import { useEffect, useState } from 'react'
import { Code2, ExternalLink, Info, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Tooltip } from '@/components/ui/tooltip'
import { api } from '@/lib/api'
import { PLATFORM_URL } from '@/lib/external-urls'

interface ApiUsage {
  session: {
    used: number
    limit: number
    remaining: number
    started_at: string | null
    reset_at: string | null
    hours_window: number
    active: boolean
  }
  weekly: {
    used: number
    limit: number
    remaining: number
    started_at: string | null
    reset_at: string | null
    days_window: number
    active: boolean
  }
  per_minute: { limit: number }
}

function fmtCompact(iso: string | null): string {
  if (!iso) return 'pas encore commencé'
  const target = new Date(iso).getTime()
  const diff = Math.max(0, Math.floor((target - Date.now()) / 1000))
  if (diff <= 0) return 'expiré'
  const d = Math.floor(diff / 86400)
  const h = Math.floor((diff % 86400) / 3600)
  const m = Math.floor((diff % 3600) / 60)
  if (d > 0) return `${d}j ${h}h${m.toString().padStart(2, '0')}m`
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}m`
  if (m > 0) return `${m}m`
  return `${diff}s`
}

function fmtRelative(date: Date): string {
  const diff = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (diff < 30) return "à l'instant"
  if (diff < 60) return `il y a ${diff}s`
  const m = Math.floor(diff / 60)
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  return date.toLocaleString()
}

export function ApiUsagePanel() {
  const [usage, setUsage] = useState<ApiUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [, force] = useState(0)

  async function load(manual = false) {
    if (manual) setRefreshing(true)
    const { data } = await api.get<{ data: ApiUsage }>('/account/api-usage')
    setUsage(data?.data ?? null)
    setLastFetched(new Date())
    setLoading(false)
    if (manual) setRefreshing(false)
  }

  useEffect(() => {
    load()
    const refetch = window.setInterval(() => load(), 30_000)
    const tick = window.setInterval(() => force((n) => n + 1), 1000)
    return () => {
      window.clearInterval(refetch)
      window.clearInterval(tick)
    }
  }, [])

  if (loading || !usage) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  const sessionPct = Math.round((usage.session.used / usage.session.limit) * 100)
  const weeklyPct = Math.round((usage.weekly.used / usage.weekly.limit) * 100)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
            <Code2 className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Plateforme développeur</h3>
            <p className="text-xs text-muted-foreground">
              Gérez vos clés API et webhooks sur platform.fakturapp.cc
            </p>
          </div>
        </div>
        <a href={PLATFORM_URL} target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm">
            Ouvrir
            <ExternalLink className="h-3 w-3 ml-1.5" />
          </Button>
        </a>
      </div>

      <div className="text-xs text-muted-foreground">
        <a
          href="https://developers.fakturapp.cc/concepts/rate-limits"
          target="_blank"
          rel="noreferrer"
          className="text-accent underline-offset-[3px] hover:underline"
        >
          En savoir plus sur les limites d&apos;utilisation
        </a>
      </div>

      <div className="space-y-6">
        <UsageRow
          title="Tous les appels API"
          subtitle={
            usage.session.active
              ? `réinitialise dans ${fmtCompact(usage.session.reset_at)}`
              : 'Démarre dès ta première requête. Ping, docs et /session ne comptent pas.'
          }
          pct={sessionPct}
        />

        <UsageRow
          title="Limite hebdomadaire"
          subtitle={
            usage.weekly.active
              ? `réinitialise dans ${fmtCompact(usage.weekly.reset_at)}`
              : 'Démarre dès ta première requête. Ping, docs et /session ne comptent pas.'
          }
          tooltip={`Plafond global de ${usage.weekly.limit.toLocaleString()} requêtes par fenêtre glissante de 7 jours.`}
          pct={weeklyPct}
        />
      </div>

      <div className="flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
        <span>
          Dernière mise à jour&nbsp;: {lastFetched ? fmtRelative(lastFetched) : '…'}
        </span>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
          aria-label="Rafraîchir"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Rafraîchir
        </button>
      </div>

      <div className="border-t border-border/60 pt-6 opacity-70">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">Usage supplémentaire</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              L&apos;usage supplémentaire est désactivé pour le moment, arrivera bientôt avec
              les abonnements Pro et le pay-as-you-go.
            </p>
          </div>
          <Tooltip content="Désactivé pour le moment">
            <span className="inline-flex pt-0.5">
              <Switch checked={false} onChange={() => {}} disabled />
            </span>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

function UsageRow({
  title,
  subtitle,
  pct,
  tooltip,
}: {
  title: string
  subtitle: string
  pct: number
  tooltip?: string
}) {
  const pctClamped = Math.min(100, Math.max(0, pct))
  const barTone = pct >= 90 ? 'bg-destructive' : pct >= 70 ? 'bg-warning' : 'bg-accent'

  return (
    <div className="flex w-full flex-row flex-wrap items-center justify-between gap-x-7 gap-y-2">
      <div className="flex w-52 shrink-0 flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-foreground">{title}</span>
          {tooltip && (
            <Tooltip content={tooltip}>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </Tooltip>
          )}
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{subtitle}</span>
      </div>
      <div className="flex flex-1 items-center gap-3 pl-6 md:max-w-xl">
        <div className="min-w-[200px] flex-1">
          <div
            className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pctClamped}
            aria-label={title}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${barTone}`}
              style={{ width: `${Math.max(1, pctClamped)}%` }}
            />
          </div>
        </div>
        <span className="min-w-[3rem] whitespace-nowrap text-right text-xs text-muted-foreground tabular-nums">
          {pct}%
        </span>
      </div>
    </div>
  )
}
