'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { getPlan, type PlanId } from '@/lib/plans'
import { PLATFORM_URL } from '@/lib/external-urls'
import {
  PartyPopper,
  RotateCcw,
  CreditCard,
  Gauge,
  ArrowUpRight,
  ExternalLink,
  AlertTriangle,
  Infinity as InfinityIcon,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'

const INVOICES_PER_PAGE = 6

function capitalize(s: string | null): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
}

interface TeamData {
  id: string
  name: string
  plan: PlanId
  subscriptionStatus?: string | null
  planPeriod?: 'monthly' | 'annual' | null
  pendingPlan?: PlanId | null
  pendingPlanPeriod?: 'monthly' | 'annual' | null
  subscriptionCurrentPeriodEnd?: string | null
  subscriptionGraceEndsAt?: string | null
  subscriptionCancelAtPeriodEnd?: boolean
  subscriptionCancelExternal?: boolean
  subscriptionStartedAt?: string | null
  hasStripeSubscription?: boolean
}

interface Invoice {
  id: string
  number: string | null
  created: number | null
  dueDate: number | null
  total: number | null
  currency: string
  status: string | null
  amountRemaining: number | null
  hostedUrl: string | null
  pdfUrl: string | null
}

function formatDate(iso?: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return ''
  }
}

function formatDateMs(ms?: number | null): string {
  if (!ms) return ''
  try {
    return new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

function formatCents(cents?: number | null, currency = 'eur'): string {
  if (cents == null) return '—'
  const symbol = currency.toLowerCase() === 'eur' ? '€' : currency.toUpperCase()
  return `${(cents / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${symbol}`
}

function invoiceStatus(s: string | null): { label: string; cls: string } {
  switch (s) {
    case 'paid':
      return { label: 'Payée', cls: 'text-foreground' }
    case 'open':
      return { label: 'En attente', cls: 'text-amber-600 dark:text-amber-400' }
    case 'void':
      return { label: 'Annulée', cls: 'text-muted-foreground' }
    case 'uncollectible':
      return { label: 'Impayée', cls: 'text-destructive' }
    default:
      return { label: s ?? '—', cls: 'text-muted-foreground' }
  }
}

function Section({
  title,
  desc,
  action,
  children,
}: {
  title: string
  desc?: string
  action?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <section className="border-t border-border py-7">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-foreground">{title}</h2>
          {desc && <p className="mt-1 max-w-md text-sm text-muted-foreground">{desc}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function PlanPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { refreshUser } = useAuth()
  const { toast } = useToast()
  const justSubscribed = params.get('subscribed') === '1' || !!params.get('checkout')
  const recover = params.get('recover') === '1'

  const [team, setTeam] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(justSubscribed)
  const [welcome, setWelcome] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoicePage, setInvoicePage] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<{
    type: string
    brand: string | null
    last4: string | null
  } | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [contactAdminOpen, setContactAdminOpen] = useState(false)

  const load = useCallback(async () => {
    const { data } = await api.get<{ team: TeamData }>('/team')
    if (data?.team) setTeam(data.team)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (justSubscribed) return
    let cancelled = false
    api.post('/billing/sync', {}).then(() => {
      if (!cancelled) load()
    })
    return () => {
      cancelled = true
    }
  }, [load, justSubscribed])

  useEffect(() => {
    if (!justSubscribed) return
    setSyncing(true)
    let active = true
    let tries = 0
    const startedAt = Date.now()
    function finish() {
      const wait = Math.max(0, 3000 - (Date.now() - startedAt))
      setTimeout(() => {
        if (!active) return
        setSyncing(false)
        setWelcome(true)
        setLoading(false)
        refreshUser()
        router.replace('/dashboard/settings/plan')
      }, wait)
    }
    async function poll() {
      await api.post('/billing/sync', {}).catch(() => {})
      const { data } = await api.get<{ team: TeamData }>('/team')
      if (!active) return
      if (data?.team) setTeam(data.team)
      const t = data?.team
      const ok =
        !!t &&
        t.plan !== 'free' &&
        !!t.hasStripeSubscription &&
        (t.subscriptionStatus === 'active' || t.subscriptionStatus === 'trialing')
      tries++
      if (ok || tries >= 6) {
        finish()
      } else {
        setTimeout(poll, 1500)
      }
    }
    poll()
    return () => {
      active = false
    }
  }, [justSubscribed, refreshUser, router])

  const currentPlanId: PlanId = team?.plan ?? 'free'
  const status = team?.subscriptionStatus ?? null
  const hasStripe = !!team?.hasStripeSubscription
  const isPaid = currentPlanId !== 'free'
  const isStripeSubscribed =
    isPaid && hasStripe && (status === 'active' || status === 'trialing' || status === 'past_due')
  const isAdminGranted = isPaid && !hasStripe
  const meta = getPlan(currentPlanId)
  const Icon = meta.icon
  const pendingPlanId: PlanId | null =
    team?.pendingPlan && team.pendingPlan !== currentPlanId ? team.pendingPlan : null
  const pendingMeta = pendingPlanId ? getPlan(pendingPlanId) : null
  const cancelAtPeriodEnd = !!team?.subscriptionCancelAtPeriodEnd
  const periodEnd = formatDate(team?.subscriptionCurrentPeriodEnd)

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
    if (isStripeSubscribed) {
      api.get<{ invoices: Invoice[] }>('/billing/invoices').then(({ data }) => {
        if (data?.invoices) setInvoices(data.invoices)
      })
      api
        .get<{ method: { type: string; brand: string | null; last4: string | null } | null }>(
          '/billing/payment-method'
        )
        .then(({ data }) => setPaymentMethod(data?.method ?? null))
    }
  }, [isStripeSubscribed])

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

  async function handleCancelScheduled() {
    setBusy('cancel-scheduled')
    const { error } = await api.post('/billing/schedule-change', { cancel: true })
    setBusy(null)
    if (error) {
      toast(error, 'error')
      return
    }
    toast('Changement de forfait annulé', 'success')
    refreshUser()
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
    load()
  }

  const renewalLine = (() => {
    if (isAdminGranted) return 'Forfait attribué par un administrateur · sans expiration.'
    if (pendingMeta && periodEnd) return `Vous passerez au forfait ${pendingMeta.name} le ${periodEnd}.`
    if (cancelAtPeriodEnd && periodEnd) return `Votre abonnement prendra fin le ${periodEnd}.`
    if (isStripeSubscribed && periodEnd)
      return `Votre abonnement se renouvellera automatiquement le ${periodEnd}.`
    if (!isPaid) return 'Forfait gratuit, pour toujours, sans aucun frais.'
    return meta.tagline
  })()

  if (loading && !syncing) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" className="text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <AnimatePresence>
        {syncing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-background/70 backdrop-blur-md"
          >
            <Spinner size="lg" className="text-primary" />
            <p className="mt-4 text-sm font-medium text-foreground">
              Traitement de votre paiement…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {welcome && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4"
        >
          <PartyPopper className="h-6 w-6 shrink-0 text-emerald-500" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Bravo, bienvenue sur Faktur {meta.name} !
            </p>
            <p className="text-xs text-muted-foreground">
              Votre paiement est confirmé et vos nouveaux avantages sont déjà actifs.
            </p>
          </div>
        </motion.div>
      )}

      {/* Plan hero */}
      <div className="flex items-start justify-between gap-4 pb-2">
        <div className="flex items-start gap-4">
          <div className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl', meta.accentSoft)}>
            <Icon className={cn('h-7 w-7', meta.accentText)} />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-bold text-foreground">{meta.label}</h1>
              {isStripeSubscribed && status !== 'past_due' && !cancelAtPeriodEnd && !pendingMeta && (
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
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2 py-0.5 text-[11px] font-semibold text-indigo-500">
                  <InfinityIcon className="h-3 w-3" /> Illimité
                </span>
              )}
            </div>
            <p className="text-[15px] font-medium text-foreground">{meta.tagline}</p>
            <p className="text-sm text-muted-foreground">{renewalLine}</p>
          </div>
        </div>
        {isAdminGranted ? (
          <Button variant="outline" onClick={() => setContactAdminOpen(true)}>
            Modifier l’abonnement
          </Button>
        ) : isPaid ? (
          <Button variant="outline" onClick={() => router.push('/dashboard/settings/plan/upgrade')}>
            Modifier l’abonnement
          </Button>
        ) : (
          <Button onClick={() => router.push('/dashboard/settings/plan/upgrade')}>
            Choisir un forfait <ArrowUpRight className="ml-1.5 h-4 w-4" />
          </Button>
        )}
      </div>

      {status === 'past_due' && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Le dernier paiement a échoué. Régularisez-le pour éviter la rétrogradation.
        </div>
      )}

      <div className="mt-6">
        {isStripeSubscribed && (
          <Section
            title="Paiement"
            action={
              <Button variant="outline" onClick={openPortal} disabled={busy === 'portal'}>
                {busy === 'portal' ? <Spinner /> : 'Mettre à jour'}
              </Button>
            }
          >
            <div className="mt-3 flex items-center gap-2.5 text-sm font-medium text-foreground">
              {paymentMethod?.type === 'link' ? (
                <>
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#00d66f]">
                    <LinkIcon className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
                  </span>
                  Link by Stripe
                </>
              ) : paymentMethod?.type === 'card' && paymentMethod.last4 ? (
                <>
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#635bff]">
                    <CreditCard className="h-3.5 w-3.5 text-white" />
                  </span>
                  {paymentMethod.brand ? capitalize(paymentMethod.brand) : 'Carte'} ••••{' '}
                  {paymentMethod.last4}
                </>
              ) : (
                <>
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#635bff]">
                    <CreditCard className="h-3.5 w-3.5 text-white" />
                  </span>
                  Moyen de paiement géré par Stripe
                </>
              )}
            </div>
          </Section>
        )}

        <Section
          title="Crédits d’utilisation"
          desc="Votre utilisation de l’API et des fonctionnalités avancées est incluse avec votre abonnement. Consultez votre consommation détaillée sur la plateforme développeur."
          action={
            <a
              href={`${PLATFORM_URL}/usage`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-semibold text-foreground shadow-surface transition-colors hover:bg-surface-hover"
            >
              <Gauge className="h-4 w-4" /> Voir dans la page Plateforme
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          }
        />

        {isStripeSubscribed && invoices.length > 0 && (
          <Section title="Factures">
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="text-foreground">
                    <th className="pb-4 font-bold">Date</th>
                    <th className="pb-4 font-bold">Total</th>
                    <th className="pb-4 font-bold">Statut</th>
                    <th className="pb-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices
                    .slice(invoicePage * INVOICES_PER_PAGE, invoicePage * INVOICES_PER_PAGE + INVOICES_PER_PAGE)
                    .map((inv) => {
                      const st = invoiceStatus(inv.status)
                      return (
                        <tr key={inv.id} className="border-t border-border">
                          <td className="py-3.5 text-foreground">{formatDateMs(inv.created)}</td>
                          <td className="py-3.5 text-foreground">{formatCents(inv.total, inv.currency)}</td>
                          <td className={cn('py-3.5', st.cls)}>{st.label}</td>
                          <td className="py-3.5 text-right">
                            {inv.hostedUrl || inv.pdfUrl ? (
                              <a
                                href={(inv.hostedUrl || inv.pdfUrl)!}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-primary hover:underline"
                              >
                                Voir
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>

            {invoices.length > INVOICES_PER_PAGE && (
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
                <span className="text-muted-foreground">
                  {invoicePage * INVOICES_PER_PAGE + 1}–
                  {Math.min((invoicePage + 1) * INVOICES_PER_PAGE, invoices.length)} sur{' '}
                  {invoices.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setInvoicePage((p) => Math.max(0, p - 1))}
                    disabled={invoicePage === 0}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-surface-hover disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setInvoicePage((p) =>
                        (p + 1) * INVOICES_PER_PAGE < invoices.length ? p + 1 : p
                      )
                    }
                    disabled={(invoicePage + 1) * INVOICES_PER_PAGE >= invoices.length}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-surface-hover disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </Section>
        )}

        {isStripeSubscribed && (
          <Section title={pendingMeta ? 'Changement programmé' : 'Annulation'}>
            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-foreground">
                {pendingMeta
                  ? `Passage au forfait ${pendingMeta.name} programmé`
                  : cancelAtPeriodEnd
                    ? 'Votre abonnement est programmé pour expirer'
                    : 'Annuler l’abonnement'}
              </span>

              {pendingMeta ? (
                <Button variant="outline" onClick={handleCancelScheduled} disabled={busy === 'cancel-scheduled'}>
                  {busy === 'cancel-scheduled' ? (
                    <Spinner />
                  ) : (
                    <>
                      <RotateCcw className="mr-1.5 h-4 w-4" /> Annuler le changement
                    </>
                  )}
                </Button>
              ) : cancelAtPeriodEnd ? (
                team?.subscriptionCancelExternal ? (
                  <Tooltip content="Cette annulation a été effectuée depuis Stripe. Pour réactiver, passez par le portail Stripe.">
                    <Button variant="outline" onClick={openPortal} disabled={busy === 'portal'}>
                      {busy === 'portal' ? (
                        <Spinner />
                      ) : (
                        <>
                          <RotateCcw className="mr-1.5 h-4 w-4" /> Réactiver via Stripe
                        </>
                      )}
                    </Button>
                  </Tooltip>
                ) : (
                  <Button variant="outline" onClick={handleResume} disabled={busy === 'resume'}>
                    {busy === 'resume' ? (
                      <Spinner />
                    ) : (
                      <>
                        <RotateCcw className="mr-1.5 h-4 w-4" /> Réactiver
                      </>
                    )}
                  </Button>
                )
              ) : (
                <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                  Annuler
                </Button>
              )}
            </div>
          </Section>
        )}

        {isAdminGranted && (
          <Section
            title="Paiement"
            desc="Ce forfait a été attribué via le panneau d’administration Faktur. Il ne se renouvelle pas et n’a aucun paiement associé."
            action={
              <Button variant="outline" onClick={() => setContactAdminOpen(true)}>
                Mettre à jour
              </Button>
            }
          >
            <div className="mt-3 flex items-center gap-2.5 text-sm font-medium text-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/15">
                <ShieldAlert className="h-3.5 w-3.5 text-indigo-500" />
              </span>
              Géré via le panneau d’administration
            </div>
          </Section>
        )}
      </div>

      <Dialog open={contactAdminOpen} onClose={() => setContactAdminOpen(false)}>
        <DialogHeader showClose={false} icon={<ShieldAlert className="h-5 w-5 text-indigo-500" />}>
          <DialogTitle>Forfait géré par votre administrateur</DialogTitle>
          <DialogDescription>
            Ce forfait a été attribué via le panneau d’administration Faktur. Pour le modifier ou
            mettre à jour le paiement, contactez votre administrateur.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setContactAdminOpen(false)}>Compris</Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={cancelOpen} onClose={() => busy !== 'cancel' && setCancelOpen(false)}>
        <DialogHeader showClose={false} icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}>
          <DialogTitle>Annuler votre abonnement ?</DialogTitle>
          <DialogDescription>
            Vous conservez tous les avantages du forfait {meta.name} jusqu’au{' '}
            {periodEnd || 'terme de la période en cours'}. À cette date, votre équipe repassera au
            plan Gratuit.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setCancelOpen(false)} disabled={busy === 'cancel'}>
            Conserver mon abonnement
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={busy === 'cancel'}>
            {busy === 'cancel' ? <Spinner /> : 'Confirmer l’annulation'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
