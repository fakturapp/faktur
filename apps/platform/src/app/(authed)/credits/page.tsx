'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, CalendarDays, CreditCard, Gauge, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { creditsClient, type CreditsUsage } from '@/lib/credits-client'

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

export default function CreditsPage() {
  const { toast } = useToast()
  const [usage, setUsage] = useState<CreditsUsage | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await creditsClient.usage()
    setLoading(false)
    if (res.error) {
      toast(res.error, 'error')
      return
    }
    setUsage(res.data?.data ?? null)
  }

  useEffect(() => {
    load()
    const t = window.setInterval(load, 15_000)
    return () => window.clearInterval(t)
  }, [])

  if (loading || !usage) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  const dailyPct = Math.round((usage.daily.used / usage.daily.limit) * 100)
  const weeklyPct = Math.round((usage.weekly.used / usage.weekly.limit) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-4 lg:px-6 py-4 md:py-6 max-w-5xl mx-auto w-full"
    >
      <div>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-accent" />
          <h1 className="text-xl font-bold text-foreground">Crédits API</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Quotas appliqués à toute l&apos;équipe sur les appels <code>/api/v2/*</code>.
          Limites fixes pour l&apos;instant, paliers payants à venir.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <UsageCard
          icon={Calendar}
          label="Aujourd'hui"
          used={usage.daily.used}
          limit={usage.daily.limit}
          remaining={usage.daily.remaining}
          pct={dailyPct}
          resetIso={usage.daily.reset_at}
        />
        <UsageCard
          icon={CalendarDays}
          label="Cette semaine"
          used={usage.weekly.used}
          limit={usage.weekly.limit}
          remaining={usage.weekly.remaining}
          pct={weeklyPct}
          resetIso={usage.weekly.reset_at}
        />
      </div>

      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Burst protection
            </h2>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {usage.per_minute.limit}
            </p>
            <p className="text-sm text-muted-foreground">requêtes par minute</p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Limite anti-abus appliquée par équipe et par compte utilisateur. Non modifiable.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Bientôt
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Abonnement Pro, pay-as-you-go, et features IA payantes (extraction PDF,
            relances rédigées, Chorus Pro) arrivent dans une prochaine mise à jour.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function UsageCard({
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
  const tone = pct >= 90 ? 'bg-danger' : pct >= 70 ? 'bg-warning' : 'bg-accent'
  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </h3>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {used.toLocaleString()}
            <span className="ml-1 text-base font-normal text-muted-foreground">
              / {limit.toLocaleString()}
            </span>
          </p>
          <p className="text-sm font-medium text-foreground">{pct}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
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
