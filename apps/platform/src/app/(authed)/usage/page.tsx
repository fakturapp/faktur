'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Info, RefreshCw } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import { creditsClient, type CreditsUsage } from '@/lib/credits-client'

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

export default function UsagePage() {
  const { toast } = useToast()
  const [usage, setUsage] = useState<CreditsUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [, force] = useState(0)

  async function load(manual = false) {
    if (manual) setRefreshing(true)
    const res = await creditsClient.usage()
    setLoading(false)
    if (manual) setRefreshing(false)
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    setUsage(res.data?.data ?? null)
    setLastFetched(new Date())
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
      <div className="flex flex-1 items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  const sessionPct = Math.round((usage.session.used / usage.session.limit) * 100)
  const weeklyPct = Math.round((usage.weekly.used / usage.weekly.limit) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 px-4 lg:px-6 pt-16 md:pt-20 pb-12 max-w-3xl mx-auto w-full"
    >
      <div>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent" />
          <h1 className="text-xl font-bold text-foreground">Usage</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          <a
            href="https://developers.fakturapp.cc/concepts/rate-limits"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline-offset-[3px] hover:underline"
          >
            En savoir plus sur les limites d&apos;utilisation
          </a>
        </p>
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
          <span className="inline-flex pt-0.5">
            <Switch checked={false} onChange={() => {}} disabled />
          </span>
        </div>
      </div>
    </motion.div>
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
  const barTone = pct >= 90 ? 'bg-danger' : pct >= 70 ? 'bg-warning' : 'bg-accent'

  return (
    <div className="flex w-full flex-row flex-wrap items-center justify-between gap-x-7 gap-y-2">
      <div className="flex w-52 shrink-0 flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-foreground">{title}</span>
          {tooltip && (
            <span title={tooltip} className="cursor-help text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{subtitle}</span>
      </div>
      <div className="flex flex-1 items-center gap-3 pl-6 md:max-w-xl">
        <div className="min-w-[200px] flex-1">
          <div
            className="relative h-2 w-full overflow-hidden rounded-full bg-surface"
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
