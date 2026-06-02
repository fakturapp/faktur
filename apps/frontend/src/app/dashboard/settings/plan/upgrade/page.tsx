'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { PLAN_IDS, PLANS, getPlan, formatPlanPrice, type PlanId } from '@/lib/plans'
import { PlanRings } from '@/components/plans/plan-rings'
import { AnimatedPrice } from '@/components/plans/animated-price'
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
  const [downgradeAccepted, setDowngradeAccepted] = useState(false)
  const [cancelScheduledOpen, setCancelScheduledOpen] = useState(false)

  useEffect(() => {
    if (downgradeTarget) setDowngradeAccepted(false)
  }, [downgradeTarget])

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
  const pendingPlanId: PlanId | null = team?.pendingPlan ?? null

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
    router.push(`/checkout/faktur_buy/${data.sessionId}`)
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

  async function handleCancelScheduled() {
    setBusy('cancel-scheduled')
    const { error } = await api.post('/billing/schedule-change', { cancel: true })
    setBusy(null)
    setCancelScheduledOpen(false)
    if (error) {
      toast(error, 'error')
      return
    }
    toast('Rétrogradation annulée', 'success')
    load()
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
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-10 flex flex-col items-center gap-3">
          <Skeleton className="h-9 w-72 rounded-lg" />
          <Skeleton className="h-9 w-44 rounded-full" />
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-8 shadow-surface">
              <div className="flex items-center gap-3">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-32" />
              <div className="mt-2 space-y-2.5">
                {[0, 1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
              <Skeleton className="mt-4 h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
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
          const curPeriod = team?.planPeriod ?? 'annual'
          const sameTier = id === currentPlanId
          const isCurrent = sameTier && (id === 'free' || period === curPeriod)
          const periodDowngrade = sameTier && curPeriod === 'annual' && period === 'monthly'
          const periodUpgrade = sameTier && curPeriod === 'monthly' && period === 'annual'
          const isDowngrade =
            isSubscribed && id !== 'free' && (RANK[id] < RANK[currentPlanId] || periodDowngrade)
          const isUpgrade =
            isSubscribed && id !== 'free' && (RANK[id] > RANK[currentPlanId] || periodUpgrade)
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
                    <AnimatedPrice value={price} className="text-4xl font-bold text-foreground" />
                    <span className="text-sm text-muted-foreground">/mois</span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-foreground">Gratuit</span>
                )}
              </div>
              <p className="mt-1 h-4 text-xs text-muted-foreground">
                {price > 0 ? (
                  period === 'annual' ? (
                    <>
                      soit <AnimatedPrice value={price * 12} /> facturés par an
                    </>
                  ) : (
                    'facturé chaque mois'
                  )
                ) : (
                  'Pour toujours'
                )}
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
                {pendingPlanId && id === pendingPlanId ? (
                  <div className="space-y-1.5 text-center">
                    <p className="text-sm font-semibold text-foreground">Rétrogradation programmée</p>
                    <p className="text-xs text-muted-foreground">
                      Effective le{' '}
                      {formatDate(team?.subscriptionCurrentPeriodEnd) || 'terme de la période'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setCancelScheduledOpen(true)}
                      className="text-sm font-semibold text-primary transition-opacity hover:opacity-70"
                    >
                      Annuler la rétrogradation
                    </button>
                  </div>
                ) : isCurrent ? (
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
                ) : isDowngrade ? (
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
                        <TrendingDown className="mr-1.5 h-4 w-4" />{' '}
                        {periodDowngrade ? 'Passer au mensuel' : `Rétrograder vers ${plan.name}`}
                      </>
                    )}
                  </Button>
                ) : isUpgrade ? (
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
                    ) : periodUpgrade ? (
                      'Passer à l’annuel'
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
            {downgradeTarget === currentPlanId
              ? 'Passer à la facturation mensuelle ?'
              : `Passer au forfait ${downgradeTarget ? getPlan(downgradeTarget).name : ''} ?`}
          </DialogTitle>
          <DialogDescription className="mt-1.5 max-w-sm">
            {(() => {
              const date = formatDate(team?.subscriptionCurrentPeriodEnd) || 'la fin de votre période'
              const billed =
                downgradeTarget &&
                (period === 'annual'
                  ? `${formatPlanPrice(getPlan(downgradeTarget).priceAnnual * 12)} par an`
                  : `${formatPlanPrice(getPlan(downgradeTarget).priceMonthly)} par mois`)
              return downgradeTarget === currentPlanId
                ? `Vous conservez la facturation annuelle de ${getPlan(currentPlanId).name} jusqu’au ${date}. À partir de cette date, vous serez facturé ${billed}. Rien ne vous est prélevé aujourd’hui.`
                : `Vous conservez votre forfait ${getPlan(currentPlanId).name} jusqu’au ${date}. À partir de cette date, vous passerez automatiquement au forfait ${getPlan(downgradeTarget!).name} et serez facturé ${billed}. Rien ne vous est prélevé aujourd’hui.`
            })()}
          </DialogDescription>

          <button
            type="button"
            onClick={() => setDowngradeAccepted((v) => !v)}
            className="mt-5 flex w-full items-start gap-2.5 text-left"
          >
            <span
              className={cn(
                'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                downgradeAccepted ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
              )}
            >
              {downgradeAccepted && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            <span className="text-[12px] leading-snug text-muted-foreground">
              En confirmant, j’accepte que mon forfait change automatiquement à la date indiquée et d’être
              facturé au tarif ci-dessus. Je peux annuler ce changement à tout moment avant cette date. Voir les{' '}
              <a
                href="/legal"
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="underline underline-offset-2 hover:text-foreground"
              >
                conditions de vente
              </a>
              .
            </span>
          </button>

          <div className="mt-5 flex w-full gap-2">
            <Button
              className="flex-1"
              onClick={() => setDowngradeTarget(null)}
              disabled={busy === downgradeTarget}
            >
              Conserver
            </Button>
            <Button
              variant="ghost"
              className="flex-1 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
              onClick={() => downgradeTarget && handleScheduleDowngrade(downgradeTarget)}
              disabled={busy === downgradeTarget || !downgradeAccepted}
            >
              {busy === downgradeTarget ? (
                <>
                  <Spinner /> Programmation…
                </>
              ) : (
                'Confirmer'
              )}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={cancelScheduledOpen}
        onClose={() => busy !== 'cancel-scheduled' && setCancelScheduledOpen(false)}
      >
        <div className="flex flex-col items-center px-2 pb-1 pt-1 text-center">
          <div className="mb-4 h-14 w-14 text-primary">
            <PlanRings tier={currentPlanId} />
          </div>
          <DialogTitle className="text-lg font-bold">Annuler la rétrogradation ?</DialogTitle>
          <DialogDescription className="mt-1.5 max-w-xs">
            Le changement programmé{pendingPlanId ? ` vers ${getPlan(pendingPlanId).name}` : ''} sera
            annulé. Vous restez sur votre forfait {getPlan(currentPlanId).name}.
          </DialogDescription>
          <div className="mt-6 flex w-full gap-2">
            <Button
              className="flex-1"
              onClick={() => setCancelScheduledOpen(false)}
              disabled={busy === 'cancel-scheduled'}
            >
              Garder
            </Button>
            <Button
              variant="ghost"
              className="flex-1 text-destructive hover:bg-destructive/10"
              onClick={handleCancelScheduled}
              disabled={busy === 'cancel-scheduled'}
            >
              {busy === 'cancel-scheduled' ? (
                <>
                  <Spinner /> Annulation…
                </>
              ) : (
                'Confirmer'
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
          <div className="mt-6 flex w-full gap-2">
            <Button className="flex-1" onClick={() => setCancelOpen(false)} disabled={busy === 'cancel'}>
              Conserver
            </Button>
            <Button
              variant="ghost"
              className="flex-1 text-destructive hover:bg-destructive/10"
              onClick={handleCancel}
              disabled={busy === 'cancel'}
            >
              {busy === 'cancel' ? (
                <>
                  <Spinner /> Rétrogradation…
                </>
              ) : (
                'Confirmer'
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
