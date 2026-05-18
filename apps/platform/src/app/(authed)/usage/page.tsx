'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Info, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import { creditsClient, type CreditsUsage } from '@/lib/credits-client'

function fmtCountdown(iso: string | null): string {
  if (!iso) return 'pas encore commencé'
  const target = new Date(iso).getTime()
  const diff = Math.max(0, Math.floor((target - Date.now()) / 1000))
  if (diff <= 0) return 'expiré'
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}min`
  if (m > 0) return `${m} min ${s.toString().padStart(2, '0')}s`
  return `${s}s`
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
      className="space-y-6 px-4 lg:px-6 py-4 md:py-6 max-w-4xl mx-auto w-full"
    >
      <div>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent" />
          <h1 className="text-xl font-bold text-foreground">Usage</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Quotas appliqués à toute l&apos;équipe sur les appels <code>/api/v2/*</code>.
        </p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="text-xs text-muted-foreground mb-5">
            <a
              href="https://developers.fakturapp.cc/concepts/rate-limits"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline-offset-[3px] hover:underline"
            >
              En savoir plus sur les limites d&apos;utilisation
            </a>
          </div>

          <UsageRow
            title="Tous les appels API"
            subtitle={
              usage.session.active
                ? `Fenêtre de ${usage.session.hours_window}h ouverte`
                : `Commence dès la première requête (fenêtre de ${usage.session.hours_window}h)`
            }
            used={usage.session.used}
            limit={usage.session.limit}
            pct={sessionPct}
            resetIn={
              usage.session.active
                ? `réinitialise dans ${fmtCountdown(usage.session.reset_at)}`
                : null
            }
          />

          <div className="my-5 h-px bg-border/60" />

          <UsageRow
            title="Limite hebdomadaire"
            subtitle="Compteur cumulé sur 7 jours"
            tooltip={`Plafond global de ${usage.weekly.limit.toLocaleString()} requêtes par semaine et par équipe.`}
            used={usage.weekly.used}
            limit={usage.weekly.limit}
            pct={weeklyPct}
            resetIn={`réinitialise dans ${fmtCountdown(usage.weekly.reset_at)}`}
          />

          <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
            <span>
              Dernière mise à jour&nbsp;:{' '}
              {lastFetched ? fmtRelative(lastFetched) : '…'}
            </span>
            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
              aria-label="Rafraîchir"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Rafraîchir
            </button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 opacity-70">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground">Usage supplémentaire</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Acheter des crédits supplémentaires en pay-as-you-go quand les quotas sont
                atteints. Désactivé pour l&apos;instant, arrivera bientôt avec les abonnements
                Pro.
              </p>
            </div>
            <span className="inline-flex pt-0.5">
              <Switch checked={false} onChange={() => {}} disabled />
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function UsageRow({
  title,
  subtitle,
  used,
  limit,
  pct,
  resetIn,
  tooltip,
}: {
  title: string
  subtitle: string
  used: number
  limit: number
  pct: number
  resetIn: string | null
  tooltip?: string
}) {
  const pctClamped = Math.min(100, Math.max(0, pct))
  const barTone = pct >= 90 ? 'bg-danger' : pct >= 70 ? 'bg-warning' : 'bg-accent'

  return (
    <div className="flex w-full flex-row flex-wrap items-center justify-between gap-x-7 gap-y-3">
      <div className="flex w-52 shrink-0 flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-foreground">{title}</span>
          {tooltip && (
            <span title={tooltip} className="cursor-help">
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
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
        <div className="min-w-[6rem] whitespace-nowrap text-right text-xs text-muted-foreground">
          <p className="font-medium text-foreground">{used.toLocaleString()} / {limit.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground/70">{pct}% utilisés</p>
          {resetIn && <p className="text-[11px] text-muted-foreground/70">{resetIn}</p>}
        </div>
      </div>
    </div>
  )
}
