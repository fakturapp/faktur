'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { PLAN_IDS, PLANS, getPlan, formatPlanPrice, type PlanId } from '@/lib/plans'
import { Check, ArrowRight, Layers, Settings, AlertTriangle } from 'lucide-react'

interface TeamData {
  id: string
  name: string
  plan: PlanId
  subscriptionStatus?: string | null
  planPeriod?: 'monthly' | 'annual' | null
  subscriptionCurrentPeriodEnd?: string | null
  subscriptionGraceEndsAt?: string | null
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

export default function PlanPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [team, setTeam] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'monthly' | 'annual'>('annual')
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    api.get<{ team: TeamData }>('/team').then(({ data }) => {
      if (data?.team) {
        setTeam(data.team)
        if (data.team.planPeriod) setPeriod(data.team.planPeriod)
      }
      setLoading(false)
    })
  }, [])

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

  async function handlePortal() {
    setBusy('portal')
    const { data, error } = await api.post<{ url: string }>('/billing/portal', {})
    if (error || !data?.url) {
      setBusy(null)
      toast(error || 'Impossible d’ouvrir la gestion de l’abonnement', 'error')
      return
    }
    window.location.href = data.url
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" className="text-primary" />
      </div>
    )
  }

  const currentMeta = getPlan(currentPlanId)
  const CurrentIcon = currentMeta.icon

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8 space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Layers className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Votre abonnement</h1>
        <p className="mx-auto max-w-lg text-sm text-muted-foreground">
          Abonnement actuel : <span className="font-medium text-foreground">{currentMeta.name}</span>
          {team ? ` pour l’équipe « ${team.name} »` : ''}.
        </p>
      </div>

      {isSubscribed && (
        <div
          className={cn(
            'mb-8 rounded-2xl border bg-card p-6 shadow-surface',
            status === 'past_due' ? 'border-amber-500/40' : currentMeta.accentRing
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', currentMeta.accentSoft)}>
                <CurrentIcon className={cn('h-6 w-6', currentMeta.accentText)} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Merci de vous être abonné à {currentMeta.name}
                </h2>
                {status === 'past_due' ? (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" /> Paiement en échec, régularisez pour conserver vos avantages.
                  </p>
                ) : team?.subscriptionCancelAtPeriodEnd ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Votre abonnement se termine le {formatDate(team?.subscriptionCurrentPeriodEnd)}.
                  </p>
                ) : team?.subscriptionCurrentPeriodEnd ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Prochain renouvellement le {formatDate(team?.subscriptionCurrentPeriodEnd)}
                    {period === 'annual' ? ' (facturation annuelle).' : ' (facturation mensuelle).'}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">{currentMeta.tagline}</p>
                )}
              </div>
            </div>
            <Button onClick={handlePortal} disabled={busy === 'portal'}>
              {busy === 'portal' ? (
                <>
                  <Spinner /> Ouverture…
                </>
              ) : (
                <>
                  <Settings className="mr-1.5 h-4 w-4" /> Gérer l’abonnement
                </>
              )}
            </Button>
          </div>
        </div>
      )}

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
                ) : isSubscribed ? (
                  <Button variant="outline" className="w-full" onClick={handlePortal} disabled={busy === 'portal'}>
                    {busy === 'portal' ? <Spinner /> : <>Gérer l’abonnement</>}
                  </Button>
                ) : id === 'free' ? (
                  <Button variant="outline" className="w-full" disabled>
                    Inclus
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

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Tous les prix sont en euros, TVA non incluse. Vous pouvez changer de plan ou annuler à tout
        moment depuis la gestion de l’abonnement.
      </p>
    </div>
  )
}
