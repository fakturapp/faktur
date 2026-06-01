'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { loadStripe, type Stripe, type Appearance } from '@stripe/stripe-js'
import { CheckoutElementsProvider, useCheckout, PaymentElement } from '@stripe/react-stripe-js/checkout'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { getPlan, formatPlanPrice, type PlanId } from '@/lib/plans'
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react'

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
    },
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[560px] flex-col px-6 pb-16 pt-8">
        <div className="relative mb-8 flex h-10 items-center justify-center">
          <div className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <button
            onClick={() => router.push('/dashboard/settings/plan/upgrade')}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground shadow-surface transition-colors hover:bg-surface-hover"
          >
            <ArrowLeft className="h-4 w-4" /> Changer votre forfait
          </button>
        </div>

        <h1 className="mb-6 text-2xl font-bold text-foreground">Configurer votre forfait</h1>

        {loading ? (
          <div className="flex justify-center py-16">
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
  const checkoutState = useCheckout()
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (checkoutState.type === 'loading') {
    return (
      <div className="flex justify-center py-16">
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
  const subtotalLabel =
    amountSubtotal != null ? formatCents(amountSubtotal) : formatPlanPrice(fullPrice)
  const dueTodayLabel = amountTotal != null ? formatCents(amountTotal) : formatPlanPrice(fullPrice)

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {meta && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-surface">
          <h2 className="text-lg font-semibold text-foreground">Forfait {meta.name}</h2>
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Abonnement {isAnnual ? 'annuel' : 'mensuel'}</span>
              <span>{subtotalLabel}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Crédit (temps déjà payé)</span>
                <span>-{formatCents(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Montant estimé des taxes</span>
              <span>0,00 €</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
              <span>Dû aujourd&apos;hui</span>
              <span>{dueTodayLabel}</span>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5 shadow-surface">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Mode de paiement</h3>
        <PaymentElement />
      </div>

      {err && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {err}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={submitting}>
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
        Renouvellement {isAnnual ? 'annuel' : 'mensuel'} jusqu&apos;à annulation
        {meta ? ` (${formatPlanPrice(fullPrice)} TTC)` : ''}. Annulable à tout moment depuis les
        paramètres. En vous abonnant, vous acceptez nos{' '}
        <a href="/legal" target="_blank" rel="noreferrer" className="underline">
          conditions d&apos;utilisation
        </a>
        .
      </p>
    </form>
  )
}
