'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { PLAN_IDS, PLANS, formatPlanPrice, type PlanId } from '@/lib/plans'
import { Check, ArrowRight, Layers } from 'lucide-react'

interface TeamData {
  id: string
  name: string
  plan: PlanId
}

export default function PlanPage() {
  const [team, setTeam] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'monthly' | 'annual'>('annual')
  const [comingSoon, setComingSoon] = useState<PlanId | null>(null)

  useEffect(() => {
    api.get<{ team: TeamData }>('/team').then(({ data }) => {
      if (data?.team) setTeam(data.team)
      setLoading(false)
    })
  }, [])

  const currentPlanId: PlanId = team?.plan ?? 'free'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" className="text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8 space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Layers className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Choisissez votre plan</h1>
        <p className="mx-auto max-w-lg text-sm text-muted-foreground">
          Passez à la vitesse supérieure quand vous en avez besoin.
          {team ? ` Plan de l’équipe « ${team.name} ».` : ''}
        </p>
      </div>

      <div className="mb-10 flex justify-center">
        <div className="inline-flex items-center rounded-full border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setPeriod('monthly')}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
              period === 'monthly'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setPeriod('annual')}
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all',
              period === 'annual'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Annuel
            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              -37%
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PLAN_IDS.map((id, i) => {
          const plan = PLANS[id]
          const Icon = plan.icon
          const price = period === 'annual' ? plan.priceAnnual : plan.priceMonthly
          const isCurrent = id === currentPlanId
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-card p-6 shadow-surface',
                plan.recommended ? `${plan.accentRing} ring-1 ring-primary/30 md:-mt-2 md:mb-2` : 'border-border'
              )}
            >
              {plan.recommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
                  Recommandé
                </span>
              )}

              <div className="flex items-center gap-2.5">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', plan.accentSoft)}>
                  <Icon className={cn('h-5 w-5', plan.accentText)} />
                </div>
                <h2 className="text-lg font-bold text-foreground">{plan.name}</h2>
                {isCurrent && (
                  <span className="ml-auto rounded-full bg-foreground/10 px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                    Actuel
                  </span>
                )}
              </div>

              <p className="mt-2 min-h-[2.5rem] text-sm text-muted-foreground">{plan.tagline}</p>

              <div className="mt-4 flex items-baseline gap-1">
                {price > 0 ? (
                  <>
                    <span className="text-4xl font-bold text-foreground">{formatPlanPrice(price)}</span>
                    <span className="text-sm text-muted-foreground">/mois</span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-foreground">Gratuit</span>
                )}
              </div>
              <p className="mt-1 h-4 text-xs text-muted-foreground">
                {price > 0
                  ? period === 'annual'
                    ? `soit ${formatPlanPrice(price * 12)} facturés par an`
                    : 'facturé chaque mois'
                  : 'Pour toujours'}
              </p>

              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/90">
                    <Check className={cn('mt-0.5 h-4 w-4 shrink-0', plan.accentText)} />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Votre plan actuel
                  </Button>
                ) : plan.recommended ? (
                  <Button className="w-full" onClick={() => setComingSoon(id)}>
                    Choisir {plan.name} <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => setComingSoon(id)}>
                    Choisir {plan.name} <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Tous les prix sont en euros, TVA non incluse. Vous pouvez changer de plan à tout moment.
      </p>

      <Dialog open={!!comingSoon} onClose={() => setComingSoon(null)}>
        <DialogHeader onClose={() => setComingSoon(null)} icon={<Layers className="h-5 w-5 text-primary" />}>
          <DialogTitle>Bientôt disponible</DialogTitle>
          <DialogDescription>
            Le paiement en ligne arrive très bientôt. En attendant, le plan de votre équipe est géré
            par un administrateur Faktur.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setComingSoon(null)}>J&apos;ai compris</Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
