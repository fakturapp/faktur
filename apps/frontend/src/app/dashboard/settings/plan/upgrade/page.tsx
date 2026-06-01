'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { PLAN_IDS, PLANS, getPlan, formatPlanPrice, type PlanId } from '@/lib/plans'
import { PlanRings } from '@/components/plans/plan-rings'
import { ArrowLeft, Check, ArrowRight, TrendingDown } from 'lucide-react'

interface TeamData {
  id: string
  name: string
  plan: PlanId
  subscriptionStatus?: string | null
  planPeriod?: 'monthly' | 'annual' | null
  pendingPlan?: PlanId | null
  subscriptionCurrentPeriodEnd?: string | null
  subscriptionCancelAtPeriodEnd?: boolean
}

function formatDate(iso?: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return ''
  }
}

const RANK: Record<PlanId, number> = { free: 0, pro: 1, team: 2 }

export default function PlanUpgradePage() {
  const router = useRouter()
  const { toast } = useToast()

  const [team, setTeam] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'monthly' | 'annual'>('annual')
  const [busy, setBusy] = useState<string | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [downgradeTarget, setDowngradeTarget] = useState<PlanId | null>(null)

  const load = useCallback(async () => {
    const { data } = await api.get<{ team: TeamData }>('/team')
    if (data?.team) {
      setTeam(data.team)
      if (data.team.planPeriod) setPeriod(data.team.planPeriod)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const currentPlanId: PlanId = team?.plan ?? 'free'
  const status = team?.subscriptionStatus ?? null
  const isSubscribed =
    currentPlanId !== 'free' && (status === 'active' || status === 'trialing' || status === 'past_due')

  async function handleSubscribe(planId: PlanId) {
    setBusy(planId)
    const { data, error } = await api.post<{ sessionId: string }>('/billing/checkout', {
      plan: planId,
      period,
    })
    if (error || !data?.sessionId) {
      setBusy(null)
      toast(error || 'Impossible de démarrer le paiement', 'error')
      return
    }
    router.push(`/checkout/facture/${data.sessionId}`)
  }

  async function handleScheduleDowngrade(planId: PlanId) {
    setBusy(planId)
    const { error } = await api.post('/billing/schedule-change', { plan: planId, period })
    setBusy(null)
    setDowngradeTarget(null)
    if (error) {
      toast(error, 'error')
      return
    }
    toast(`Vous passerez au forfait ${getPlan(planId).name} à la fin de votre période`, 'success')
    router.push('/dashboard/settings/plan')
  }

  async function handleCancel() {
    setBusy('cancel')
    const { error } = await api.post('/billing/cancel', {})
    setBusy(null)
    setCancelOpen(false)
    if (error) {
      toast(error, 'error')
      return
    }
    toast('Abonnement résilié, il restera actif jusqu’à son expiration', 'success')
    router.push('/dashboard/settings/plan')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" className="text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/settings/plan')}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Retour à mon abonnement
        </button>
      </div>

      <div className="mb-10 space-y-2 text-center">
        <h1 className="text-4xl font-bold text-foreground">Choisissez votre forfait</h1>
        <p className="mx-auto max-w-lg text-sm text-muted-foreground">
          Changez de forfait à tout moment. Les modifications sont calculées au prorata.
        </p>
      </div>

      <div className="mb-10 flex justify-center">
        <div className="inline-flex items-center rounded-full border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setPeriod('monthly')}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
              period === 'monthly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setPeriod('annual')}
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all',
              period === 'annual' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Annuel
            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              -37%
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {PLAN_IDS.map((id, i) => {
          const plan = PLANS[id]
          const price = period === 'annual' ? plan.priceAnnual : plan.priceMonthly
          const isCurrent = id === currentPlanId
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                'relative flex flex-col rounded-3xl border bg-card p-8 shadow-surface',
                plan.recommended ? `${plan.accentRing} ring-1 ring-primary/30 md:-mt-3 md:mb-3` : 'border-border'
              )}
            >
              {plan.recommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
                  Recommandé
                </span>
              )}

              <div className="flex items-center gap-3">
                <div className={cn('h-14 w-14 shrink-0', plan.accentText)}>
                  <PlanRings tier={id} />
                </div>
                <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
                {isCurrent && (
                  <span className="ml-auto rounded-full bg-foreground/10 px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                    Forfait actuel
                  </span>
                )}
              </div>

              <p className="mt-3 min-h-[2.5rem] text-sm text-muted-foreground">{plan.tagline}</p>

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
                    Forfait actuel
                  </Button>
                ) : isSubscribed && id === 'free' ? (
                  <Button
                    variant="outline"
                    className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => setCancelOpen(true)}
                    disabled={busy === 'cancel'}
                  >
                    <TrendingDown className="mr-1.5 h-4 w-4" /> Rétrograder
                  </Button>
                ) : isSubscribed && RANK[id] < RANK[currentPlanId] ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setDowngradeTarget(id)}
                    disabled={busy === id}
                  >
                    {busy === id ? (
                      <>
                        <Spinner /> Programmation…
                      </>
                    ) : (
                      <>
                        <TrendingDown className="mr-1.5 h-4 w-4" /> Rétrograder vers {plan.name}
                      </>
                    )}
                  </Button>
                ) : isSubscribed ? (
                  <Button
                    variant={plan.recommended ? undefined : 'outline'}
                    className="w-full"
                    onClick={() => handleSubscribe(id)}
                    disabled={busy === id}
                  >
                    {busy === id ? (
                      <>
                        <Spinner /> Redirection…
                      </>
                    ) : (
                      `Passer à ${plan.name}`
                    )}
                  </Button>
                ) : (
                  <Button
                    variant={plan.recommended ? undefined : 'outline'}
                    className="w-full"
                    onClick={() => handleSubscribe(id)}
                    disabled={busy === id}
                  >
                    {busy === id ? (
                      <>
                        <Spinner /> Redirection…
                      </>
                    ) : (
                      <>
                        S’abonner à {plan.name} <ArrowRight className="ml-1.5 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <Dialog
        open={downgradeTarget !== null}
        onClose={() => busy !== downgradeTarget && setDowngradeTarget(null)}
      >
        <div className="flex flex-col items-center px-2 pb-1 pt-1 text-center">
          <div className={cn('mb-4 h-14 w-14', downgradeTarget ? getPlan(downgradeTarget).accentText : '')}>
            {downgradeTarget && <PlanRings tier={downgradeTarget} />}
          </div>
          <DialogTitle className="text-lg font-bold">
            Passer au forfait {downgradeTarget ? getPlan(downgradeTarget).name : ''} ?
          </DialogTitle>
          <DialogDescription className="mt-1.5 max-w-xs">
            Vous gardez {getPlan(currentPlanId).name} jusqu’au{' '}
            {formatDate(team?.subscriptionCurrentPeriodEnd) || 'terme de la période'}, puis passage
            automatique. Rien ne vous est prélevé maintenant.
          </DialogDescription>
          <div className="mt-6 flex w-full flex-col gap-2">
            <Button onClick={() => setDowngradeTarget(null)} disabled={busy === downgradeTarget}>
              Rester sur le forfait {getPlan(currentPlanId).name}
            </Button>
            <Button
              variant="ghost"
              className="text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
              onClick={() => downgradeTarget && handleScheduleDowngrade(downgradeTarget)}
              disabled={busy === downgradeTarget}
            >
              {busy === downgradeTarget ? (
                <>
                  <Spinner /> Programmation en cours…
                </>
              ) : (
                'Confirmer le changement'
              )}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={cancelOpen} onClose={() => busy !== 'cancel' && setCancelOpen(false)}>
        <div className="flex flex-col items-center px-2 pb-1 pt-1 text-center">
          <div className="mb-4 h-14 w-14 text-muted-foreground">
            <PlanRings tier="free" />
          </div>
          <DialogTitle className="text-lg font-bold">Passer au plan Gratuit ?</DialogTitle>
          <DialogDescription className="mt-1.5 max-w-xs">
            Vous gardez {getPlan(currentPlanId).name} jusqu’au{' '}
            {formatDate(team?.subscriptionCurrentPeriodEnd) || 'terme de la période'}, puis retour au
            plan Gratuit. Réactivable à tout moment d’ici là.
          </DialogDescription>
          <div className="mt-6 flex w-full flex-col gap-2">
            <Button onClick={() => setCancelOpen(false)} disabled={busy === 'cancel'}>
              Rester sur le plan {getPlan(currentPlanId).name}
            </Button>
            <Button
              variant="ghost"
              className="text-destructive hover:bg-destructive/10"
              onClick={handleCancel}
              disabled={busy === 'cancel'}
            >
              {busy === 'cancel' ? (
                <>
                  <Spinner /> Rétrogradation en cours…
                </>
              ) : (
                'Confirmer la rétrogradation'
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
