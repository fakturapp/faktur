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
import { Check, ArrowRight, Settings, AlertTriangle, PartyPopper, RotateCcw } from 'lucide-react'

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
  const params = useSearchParams()
  const { refreshUser } = useAuth()
  const { toast } = useToast()
  const justSubscribed = params.get('subscribed') === '1'

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
    if (!justSubscribed) return
    refreshUser()
    const t1 = setTimeout(() => load(), 1500)
    const t2 = setTimeout(() => load(), 4000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [justSubscribed, load, refreshUser])

  const currentPlanId: PlanId = team?.plan ?? 'free'
  const status = team?.subscriptionStatus ?? null
  const isSubscribed =
    currentPlanId !== 'free' && (status === 'active' || status === 'trialing' || status === 'past_due')
  const meta = getPlan(currentPlanId)
  const Icon = meta.icon

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
          'rounded-2xl border bg-card p-6 shadow-surface',
          status === 'past_due' ? 'border-amber-500/40' : isSubscribed ? meta.accentRing : 'border-border'
        )}
      >
        <div className="flex items-start gap-4">
          <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', meta.accentSoft)}>
            <Icon className={cn('h-6 w-6', meta.accentText)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{meta.label}</h2>
              {isSubscribed && status !== 'past_due' && (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Actif
                </span>
              )}
              {status === 'past_due' && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  Paiement en échec
                </span>
              )}
            </div>

            {isSubscribed ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {status === 'past_due' ? (
                  <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" /> Régularisez le paiement pour conserver vos avantages.
                  </span>
                ) : team?.subscriptionCancelAtPeriodEnd ? (
                  `Abonnement résilié : expire le ${formatDate(team?.subscriptionCurrentPeriodEnd)}.`
                ) : team?.subscriptionCurrentPeriodEnd ? (
                  `Se renouvelle le ${formatDate(team?.subscriptionCurrentPeriodEnd)}.`
                ) : (
                  meta.tagline
                )}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">{meta.tagline}</p>
            )}

            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {meta.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground/90">
                  <Check className={cn('mt-0.5 h-4 w-4 shrink-0', meta.accentText)} />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {isSubscribed ? (
                <>
                  <Button onClick={handlePortal} disabled={busy === 'portal'}>
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
                    <Button variant="outline" onClick={handleResume} disabled={busy === 'resume'}>
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
                    <Button variant="outline" onClick={() => router.push('/dashboard/settings/plan/upgrade')}>
                      Améliorer le forfait <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  )}
                </>
              ) : (
                <Button onClick={() => router.push('/dashboard/settings/plan/upgrade')}>
                  Choisir un forfait <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
