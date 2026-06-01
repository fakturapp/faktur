'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { loadStripe, type Stripe, type Appearance } from '@stripe/stripe-js'
import { CheckoutElementsProvider, useCheckout, PaymentElement } from '@stripe/react-stripe-js/checkout'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getPlan, formatPlanPrice, type PlanId } from '@/lib/plans'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

interface CheckoutData {
  clientSecret: string
  publishableKey: string
  plan: PlanId | null
  period: 'monthly' | 'annual' | null
  amountSubtotal?: number | null
  amountTotal?: number | null
  amountDiscount?: number | null
}

function formatCents(cents: number): string {
  return `${(cents / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`
}

export default function SubscriptionCheckoutPage() {
  const params = useParams<{ session: string }>()
  const router = useRouter()
  const sessionId = params?.session

  const [data, setData] = useState<CheckoutData | null>(null)
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const init = useCallback(async () => {
    if (!sessionId) return
    const { data: d, error } = await api.get<CheckoutData>(`/billing/checkout/${sessionId}`)
    if (error || !d?.clientSecret) {
      setError(error || 'Session de paiement introuvable')
      setLoading(false)
      return
    }
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || d.publishableKey
    if (!pk) {
      setError('Clé publique Stripe manquante')
      setLoading(false)
      return
    }
    setStripePromise(loadStripe(pk))
    setData(d)
    setLoading(false)
  }, [sessionId])

  useEffect(() => {
    init()
  }, [init])

  const appearance: Appearance = {
    theme:
      typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
        ? 'night'
        : 'stripe',
    variables: {
      colorPrimary: '#6366f1',
      borderRadius: '12px',
      fontFamily: 'inherit',
      fontSizeBase: '15px',
      spacingUnit: '4px',
    },
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[600px] flex-col px-5 pb-20 pt-7">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard/settings/plan/upgrade')}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground shadow-surface transition-colors hover:bg-surface-hover"
          >
            <ArrowLeft className="h-4 w-4" /> Changer votre forfait
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Faktur" className="h-7 w-7" />
            <span className="text-base font-semibold tracking-tight text-foreground">Faktur</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" className="text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/settings/plan')}>
              Retour aux forfaits
            </Button>
          </div>
        ) : stripePromise && data ? (
          <CheckoutElementsProvider
            stripe={stripePromise}
            options={{ clientSecret: data.clientSecret, elementsOptions: { appearance } }}
          >
            <CheckoutInner
              plan={data.plan}
              period={data.period}
              amountSubtotal={data.amountSubtotal ?? null}
              amountTotal={data.amountTotal ?? null}
              amountDiscount={data.amountDiscount ?? null}
            />
          </CheckoutElementsProvider>
        ) : null}
      </div>
    </div>
  )
}

function CheckoutInner({
  plan,
  period,
  amountSubtotal,
  amountTotal,
  amountDiscount,
}: {
  plan: PlanId | null
  period: 'monthly' | 'annual' | null
  amountSubtotal: number | null
  amountTotal: number | null
  amountDiscount: number | null
}) {
  const router = useRouter()
  const { user } = useAuth()
  const checkoutState = useCheckout()
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (checkoutState.type === 'loading') {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-primary" />
      </div>
    )
  }
  if (checkoutState.type === 'error') {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
        {checkoutState.error.message}
      </div>
    )
  }

  const checkout = checkoutState.checkout
  const meta = plan ? getPlan(plan) : null
  const isAnnual = period === 'annual'
  const monthly = meta ? (isAnnual ? meta.priceAnnual : meta.priceMonthly) : 0
  const fullPrice = isAnnual ? monthly * 12 : monthly
  const discount = amountDiscount && amountDiscount > 0 ? amountDiscount : 0
  const subtotalLabel = amountSubtotal != null ? formatCents(amountSubtotal) : formatPlanPrice(fullPrice)
  const dueTodayLabel = amountTotal != null ? formatCents(amountTotal) : formatPlanPrice(fullPrice)

  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const invoiceRef = meta ? `ABO-${meta.name.toUpperCase()}-${new Date().getFullYear()}` : ''
  const currentTeam = user?.teams?.find((t) => t.id === user.currentTeamId) ?? null
  const accentBar = plan === 'team' ? 'bg-amber-500' : 'bg-primary'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setErr(null)
    const result: any = await checkout.confirm()
    if (result?.type === 'error') {
      setErr(result.error?.message || 'Le paiement a échoué')
      setSubmitting(false)
      return
    }
    router.push('/dashboard/settings/plan?subscribed=1')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {meta && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-surface">
          <div className="flex items-start justify-between gap-4 p-6 pb-5">
            <div className="flex items-center gap-3">
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', meta.accentSoft)}>
                <meta.icon className={cn('h-5 w-5', meta.accentText)} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Facture d&apos;abonnement
                </p>
                <h2 className="text-lg font-bold text-foreground">Forfait {meta.name}</h2>
              </div>
            </div>
            <div className="text-right">
              <p className={cn('text-xs font-bold uppercase tracking-wider', meta.accentText)}>Facture</p>
              <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{invoiceRef}</p>
              <p className="text-[11px] text-muted-foreground">{today}</p>
            </div>
          </div>

          <div className={cn('mx-6 h-0.5 rounded-full', accentBar)} />

          <div className="grid grid-cols-2 gap-4 p-6 pb-4">
            <div className="space-y-1">
              <p className={cn('text-[10px] font-semibold uppercase tracking-wider', meta.accentText)}>
                Émetteur
              </p>
              <p className="text-sm font-medium text-foreground">Faktur</p>
              <p className="text-xs text-muted-foreground">Logiciel de facturation</p>
            </div>
            <div className="space-y-1 text-right">
              <p className={cn('text-[10px] font-semibold uppercase tracking-wider', meta.accentText)}>
                Facturé à
              </p>
              {currentTeam && <p className="truncate text-sm font-medium text-foreground">{currentTeam.name}</p>}
              {user?.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
            </div>
          </div>

          <div className="px-6">
            <div
              className={cn(
                'flex items-center justify-between rounded-t-lg px-4 py-2 text-[11px] font-semibold uppercase tracking-wider',
                meta.accentSoft,
                meta.accentText
              )}
            >
              <span>Description</span>
              <span>Montant</span>
            </div>

            <div className="flex items-center justify-between border-b border-border px-4 py-3 text-sm">
              <span className="text-foreground">
                Forfait {meta.name} · Abonnement {isAnnual ? 'annuel' : 'mensuel'}
              </span>
              <span className="font-medium text-foreground">{subtotalLabel}</span>
            </div>

            {discount > 0 && (
              <div className="flex items-center justify-between border-b border-border px-4 py-3 text-sm">
                <span className="text-emerald-600 dark:text-emerald-400">Crédit · temps déjà payé</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  -{formatCents(discount)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-border px-4 py-3 text-sm">
              <span className="text-muted-foreground">TVA estimée</span>
              <span className="text-muted-foreground">0,00 €</span>
            </div>
          </div>

          <div className="p-6 pt-4">
            <div
              className={cn(
                'flex items-center justify-between rounded-xl px-4 py-3',
                meta.accentSoft
              )}
            >
              <span className={cn('text-sm font-semibold', meta.accentText)}>Dû aujourd&apos;hui</span>
              <span className={cn('text-xl font-bold', meta.accentText)}>{dueTodayLabel}</span>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Renouvellement {isAnnual ? 'annuel' : 'mensuel'} jusqu&apos;à annulation
              {meta ? ` (${formatPlanPrice(fullPrice)} TTC)` : ''}. Annulable à tout moment depuis vos
              paramètres.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6 shadow-surface">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Mode de paiement</h3>
        <PaymentElement />
      </div>

      {err && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {err}
        </div>
      )}

      <Button type="submit" className="w-full py-3 text-base" disabled={submitting}>
        {submitting ? (
          <>
            <Spinner /> Paiement en cours…
          </>
        ) : (
          "S'abonner"
        )}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" /> Paiement sécurisé par Stripe
      </p>
      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        En vous abonnant, vous acceptez nos{' '}
        <a href="/legal" target="_blank" rel="noreferrer" className="underline">
          conditions d&apos;utilisation
        </a>{' '}
        et notre{' '}
        <a href="/legal" target="_blank" rel="noreferrer" className="underline">
          politique de confidentialité
        </a>
        , et autorisez Faktur à enregistrer votre mode de paiement et à le débiter pour ce
        renouvellement.
      </p>
    </form>
  )
}
