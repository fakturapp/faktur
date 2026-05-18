'use client'

import { useEffect, useState } from 'react'
import { Calendar, CalendarDays, Code2, ExternalLink, Gauge, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import { PLATFORM_URL } from '@/lib/external-urls'

interface ApiUsage {
  daily: { used: number; limit: number; remaining: number; reset_at: string }
  weekly: { used: number; limit: number; remaining: number; reset_at: string }
  per_minute: { limit: number }
}

function fmtReset(iso: string): string {
  const target = new Date(iso).getTime()
  const diff = Math.max(0, Math.floor((target - Date.now()) / 1000))
  if (diff < 60) return `dans ${diff}s`
  const m = Math.floor(diff / 60)
  if (m < 60) return `dans ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `dans ${h} h`
  return `dans ${Math.floor(h / 24)} j`
}

export function ApiUsagePanel() {
  const [usage, setUsage] = useState<ApiUsage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data } = await api.get<{ data: ApiUsage }>('/account/api-usage')
      if (cancelled) return
      setUsage(data?.data ?? null)
      setLoading(false)
    }

    load()
    const t = window.setInterval(load, 15_000)
    return () => {
      cancelled = true
      window.clearInterval(t)
    }
  }, [])

  if (loading || !usage) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex justify-center">
            <Spinner />
          </div>
        </CardContent>
      </Card>
    )
  }

  const dailyPct = Math.round((usage.daily.used / usage.daily.limit) * 100)
  const weeklyPct = Math.round((usage.weekly.used / usage.weekly.limit) * 100)

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                <Code2 className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Plateforme développeur</h3>
                <p className="text-xs text-muted-foreground">
                  Gérez vos clés API et webhooks depuis platform.fakturapp.cc
                </p>
              </div>
            </div>
            <a href={PLATFORM_URL} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">
                Ouvrir la plateforme
                <ExternalLink className="h-3 w-3 ml-1.5" />
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <UsageGauge
          icon={Calendar}
          label="Aujourd'hui"
          used={usage.daily.used}
          limit={usage.daily.limit}
          remaining={usage.daily.remaining}
          pct={dailyPct}
          resetIso={usage.daily.reset_at}
        />
        <UsageGauge
          icon={CalendarDays}
          label="Cette semaine"
          used={usage.weekly.used}
          limit={usage.weekly.limit}
          remaining={usage.weekly.remaining}
          pct={weeklyPct}
          resetIso={usage.weekly.reset_at}
        />
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft">
              <Gauge className="h-4 w-4 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground">Burst protection</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {usage.per_minute.limit} requêtes par minute maximum. Anti-abus appliqué par
                équipe et par compte, non modifiable.
              </p>
            </div>
            <span className="text-lg font-bold tabular-nums text-foreground">
              {usage.per_minute.limit}
              <span className="ml-1 text-xs font-normal text-muted-foreground">/min</span>
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft">
              <Zap className="h-4 w-4 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground">Crédits payants</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Abonnement Pro, pay-as-you-go et features IA payantes arrivent prochainement.
                Pour l&apos;instant, tous les quotas ci-dessus sont gratuits.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function UsageGauge({
  icon: Icon,
  label,
  used,
  limit,
  remaining,
  pct,
  resetIso,
}: {
  icon: typeof Calendar
  label: string
  used: number
  limit: number
  remaining: number
  pct: number
  resetIso: string
}) {
  const tone = pct >= 90 ? 'bg-destructive' : pct >= 70 ? 'bg-warning' : 'bg-accent'
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </h3>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {used.toLocaleString()}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              / {limit.toLocaleString()}
            </span>
          </p>
          <p className="text-sm font-medium text-foreground">{pct}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${tone}`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{remaining.toLocaleString()} restantes</span>
          <span>réinitialise {fmtReset(resetIso)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
