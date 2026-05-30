'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { getPlan, type PlanId } from '@/lib/plans'
import {
  Check,
  ArrowRight,
  Settings,
  AlertTriangle,
  PartyPopper,
  RotateCcw,
  Infinity as InfinityIcon,
  CalendarClock,
  ShieldCheck,
} from 'lucide-react'

interface TeamData {
  id: string
  name: string
  plan: PlanId
  subscriptionStatus?: string | null
  planPeriod?: 'monthly' | 'annual' | null
  subscriptionCurrentPeriodEnd?: string | null
  subscriptionGraceEndsAt?: string | null
  subscriptionCancelAtPeriodEnd?: boolean
  subscriptionStartedAt?: string | null
  hasStripeSubscription?: boolean
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
  const params = useSearchParams()
  const { refreshUser } = useAuth()
  const { toast } = useToast()
  const justSubscribed = params.get('subscribed') === '1'
  const recover = params.get('recover') === '1'

  const [team, setTeam] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await api.get<{ team: TeamData }>('/team')
    if (data?.team) setTeam(data.team)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    let cancelled = false
    api.post('/billing/sync', {}).then(() => {
      if (!cancelled) load()
    })
    return () => {
      cancelled = true
    }
  }, [load])

  useEffect(() => {
    if (!justSubscribed) return
    refreshUser()
    const t = setTimeout(() => {
      api.post('/billing/sync', {}).then(() => load())
    }, 2500)
    return () => clearTimeout(t)
  }, [justSubscribed, load, refreshUser])

  const currentPlanId: PlanId = team?.plan ?? 'free'
  const status = team?.subscriptionStatus ?? null
  const hasStripe = !!team?.hasStripeSubscription
  const isPaid = currentPlanId !== 'free'
  const isStripeSubscribed =
    isPaid && hasStripe && (status === 'active' || status === 'trialing' || status === 'past_due')
  const isAdminGranted = isPaid && !hasStripe
  const meta = getPlan(currentPlanId)
  const Icon = meta.icon

  const openPortal = useCallback(async () => {
    setBusy('portal')
    const { data, error } = await api.post<{ url: string }>('/billing/portal', {})
    if (error || !data?.url) {
      setBusy(null)
      toast(error || 'Impossible d’ouvrir la gestion de l’abonnement', 'error')
      return
    }
    window.location.href = data.url
  }, [toast])

  useEffect(() => {
    if (recover && !loading && isStripeSubscribed) {
      openPortal()
    }
  }, [recover, loading, isStripeSubscribed, openPortal])

  async function handleResume() {
    setBusy('resume')
    const { error } = await api.post('/billing/cancel', { resume: true })
    setBusy(null)
    if (error) {
      toast(error, 'error')
      return
    }
    toast('Abonnement réactivé', 'success')
    load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" className="text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      {justSubscribed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4"
        >
          <PartyPopper className="h-6 w-6 shrink-0 text-emerald-500" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Félicitations, vous êtes passé au plan {meta.name} !
            </p>
            <p className="text-xs text-muted-foreground">
              Votre paiement est confirmé. Vos nouveaux avantages sont déjà actifs.
            </p>
          </div>
        </motion.div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Votre abonnement</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez le forfait de l’équipe {team ? `« ${team.name} »` : ''}.
        </p>
      </div>

      <div
        className={cn(
          'overflow-hidden rounded-2xl border bg-card shadow-surface',
          status === 'past_due' ? 'border-amber-500/40' : isPaid ? meta.accentRing : 'border-border'
        )}
      >
        <div className="grid md:grid-cols-[1fr_minmax(0,18rem)]">
          {/* Plan */}
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', meta.accentSoft)}>
                <Icon className={cn('h-6 w-6', meta.accentText)} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{meta.label}</h2>
                  {isStripeSubscribed && status !== 'past_due' && (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Actif
                    </span>
                  )}
                  {status === 'past_due' && (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      Paiement en échec
                    </span>
                  )}
                  {isAdminGranted && (
                    <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[11px] font-semibold text-indigo-500">
                      Attribué par l’administrateur
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{meta.tagline}</p>
              </div>
            </div>

            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {meta.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground/90">
                  <Check className={cn('mt-0.5 h-4 w-4 shrink-0', meta.accentText)} />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Détails / gestion du paiement */}
          <div className="border-t border-border bg-muted/20 p-6 md:border-l md:border-t-0">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Détails de l’abonnement
            </h3>

            {isAdminGranted ? (
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-foreground">
                  <InfinityIcon className="h-4 w-4 text-indigo-500" />
                  Sans expiration · Illimité
                </div>
                <p className="text-xs text-muted-foreground">
                  Ce forfait a été attribué manuellement par un administrateur Faktur. Il ne se
                  renouvelle pas et n’a pas de paiement associé.
                </p>
                {currentPlanId !== 'team' && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/dashboard/settings/plan/upgrade')}
                  >
                    Voir les forfaits
                  </Button>
                )}
              </div>
            ) : isStripeSubscribed ? (
              <div className="mt-4 space-y-4 text-sm">
                {team?.subscriptionStartedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground">Abonné depuis</p>
                    <p className="font-medium text-foreground">
                      {formatDate(team.subscriptionStartedAt)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">
                    {team?.subscriptionCancelAtPeriodEnd ? 'Expire le' : 'Se renouvelle le'}
                  </p>
                  <p className="inline-flex items-center gap-1.5 font-medium text-foreground">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    {formatDate(team?.subscriptionCurrentPeriodEnd) || '—'}
                  </p>
                </div>

                {status === 'past_due' && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Le dernier paiement a échoué. Régularisez-le pour éviter la rétrogradation.
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <Button className="w-full" onClick={openPortal} disabled={busy === 'portal'}>
                    {busy === 'portal' ? (
                      <>
                        <Spinner /> Ouverture…
                      </>
                    ) : (
                      <>
                        <Settings className="mr-1.5 h-4 w-4" /> Gérer mon abonnement
                      </>
                    )}
                  </Button>
                  {team?.subscriptionCancelAtPeriodEnd ? (
                    <Button variant="outline" className="w-full" onClick={handleResume} disabled={busy === 'resume'}>
                      {busy === 'resume' ? (
                        <>
                          <Spinner /> …
                        </>
                      ) : (
                        <>
                          <RotateCcw className="mr-1.5 h-4 w-4" /> Réactiver
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push('/dashboard/settings/plan/upgrade')}
                    >
                      Changer de forfait
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  Forfait gratuit, pour toujours.
                </div>
                <Button className="w-full" onClick={() => router.push('/dashboard/settings/plan/upgrade')}>
                  Choisir un forfait <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
