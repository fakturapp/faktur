'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { loadStripe, type Stripe, type Appearance } from '@stripe/stripe-js'
import { CheckoutElementsProvider, useCheckout, PaymentElement } from '@stripe/react-stripe-js/checkout'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { getPlan, formatPlanPrice, type PlanId } from '@/lib/plans'
import { ChevronLeft, Check, Info } from 'lucide-react'

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

const CHECKOUT_FONT_FAMILY =
  "'SN Pro', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
const CHECKOUT_FONT_CSS = 'https://cdn.jsdelivr.net/npm/@fontsource/sn-pro@5.2.6/index.css'

function buildAppearance(): Appearance {
  const dark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  return {
    theme: 'flat',
    labels: 'floating',
    variables: {
      colorPrimary: '#6366f1',
      colorBackground: dark ? '#18181b' : '#f4f4f5',
      colorText: dark ? '#fafafa' : '#18181b',
      colorTextSecondary: dark ? '#a1a1aa' : '#71717a',
      colorTextPlaceholder: dark ? '#71717a' : '#a1a1aa',
      colorDanger: '#ef4444',
      borderRadius: '10px',
      fontSizeBase: '14px',
      spacingUnit: '4px',
      fontFamily: CHECKOUT_FONT_FAMILY,
    },
    rules: {
      '.Tab': {
        border: dark ? '1px solid #3f3f46' : '1px solid #e4e4e7',
        backgroundColor: 'transparent',
      },
      '.Tab--selected': {
        border: dark ? '2px solid #fafafa' : '2px solid #18181b',
        backgroundColor: dark ? '#27272a' : '#ffffff',
      },
      '.Input': {
        border: 'none',
      },
    },
  }
}

export default function SubscriptionCheckoutPage() {
  const params = useParams<{ key: string }>()
  const router = useRouter()
  const sessionId = params?.key

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

  return (
    <div className="flex min-h-screen justify-center bg-background px-5 py-10">
      <div className="w-full max-w-[440px]">
        <button
          onClick={() => router.push('/dashboard/settings/plan/upgrade')}
          className="mb-8 flex items-center text-foreground transition-opacity hover:opacity-70"
        >
          <ChevronLeft className="mr-3 h-5 w-5" strokeWidth={2.5} />
          <h1 className="text-[18px] font-semibold">Configurer votre forfait</h1>
        </button>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" className="text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <button
              className="mt-4 text-sm font-semibold text-foreground underline"
              onClick={() => router.push('/dashboard/settings/plan')}
            >
              Retour aux forfaits
            </button>
          </div>
        ) : stripePromise && data ? (
          <CheckoutElementsProvider
            stripe={stripePromise}
            options={{
              clientSecret: data.clientSecret,
              elementsOptions: {
                appearance: buildAppearance(),
                fonts: [{ cssSrc: CHECKOUT_FONT_CSS }],
              },
            }}
          >
            <CheckoutInner
              plan={data.plan}
              period={data.period}
              sessionId={sessionId as string}
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
  sessionId,
  amountSubtotal,
  amountTotal,
  amountDiscount,
}: {
  plan: PlanId | null
  period: 'monthly' | 'annual' | null
  sessionId: string
  amountSubtotal: number | null
  amountTotal: number | null
  amountDiscount: number | null
}) {
  const router = useRouter()
  const checkoutState = useCheckout()
  const [submitting, setSubmitting] = useState(false)
  const [succeeded, setSucceeded] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const [amounts, setAmounts] = useState<{
    subtotal: number | null
    total: number | null
    discount: number | null
  }>({ subtotal: amountSubtotal, total: amountTotal, discount: amountDiscount })
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoInput, setPromoInput] = useState('')
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [promoErr, setPromoErr] = useState<string | null>(null)
  const [promoBusy, setPromoBusy] = useState(false)

  const refreshAmounts = useCallback(async () => {
    const { data } = await api.get<CheckoutData>(`/billing/checkout/${sessionId}`)
    if (data) {
      setAmounts({
        subtotal: data.amountSubtotal ?? null,
        total: data.amountTotal ?? null,
        discount: data.amountDiscount ?? null,
      })
    }
  }, [sessionId])

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
  const discount = amounts.discount && amounts.discount > 0 ? amounts.discount : 0
  const subtotalLabel = amounts.subtotal != null ? formatCents(amounts.subtotal) : formatPlanPrice(fullPrice)
  const dueTodayLabel = amounts.total != null ? formatCents(amounts.total) : formatPlanPrice(fullPrice)

  async function applyPromo() {
    const value = promoInput.trim().toUpperCase()
    if (!value || promoBusy) return
    setPromoBusy(true)
    setPromoErr(null)
    const res: any = await checkout.applyPromotionCode(value)
    if (res?.type === 'error') {
      setPromoErr(res.error?.message || "Ce code promo n'est pas valide.")
      setPromoBusy(false)
      return
    }
    setPromoCode(value)
    await refreshAmounts()
    setPromoBusy(false)
  }

  async function removePromo() {
    if (promoBusy) return
    setPromoBusy(true)
    setPromoErr(null)
    try {
      await checkout.removePromotionCode()
    } catch {}
    setPromoCode(null)
    setPromoInput('')
    setPromoOpen(false)
    await refreshAmounts()
    setPromoBusy(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setErr(null)
    const result: any = await checkout.confirm({ redirect: 'if_required' })
    if (result?.type === 'error') {
      setErr(result.error?.message || 'Le paiement a échoué')
      setSubmitting(false)
      return
    }
    setSucceeded(true)
    setTimeout(() => router.push('/dashboard/settings/plan?subscribed=1'), 1800)
  }

  if (succeeded) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-24">
        <motion.svg
          width="88"
          height="88"
          viewBox="0 0 52 52"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        >
          <motion.circle
            cx="26"
            cy="26"
            r="24"
            fill="none"
            stroke="#635bff"
            strokeWidth="3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
          <motion.path
            fill="none"
            stroke="#635bff"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 27 l8 8 l15 -17"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.45, ease: 'easeOut' }}
          />
        </motion.svg>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="text-[15px] font-semibold text-foreground"
        >
          Paiement confirmé
        </motion.p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {meta && (
        <div className="mb-6">
          <h2 className="mb-3 text-[15px] font-semibold text-foreground">Forfait {meta.name}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Abonnement {isAnnual ? 'annuel' : 'mensuel'}
              </span>
              <span className="text-foreground">{subtotalLabel}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <span className="text-emerald-600 dark:text-emerald-400">
                  {promoCode ? 'Code promo' : 'Report de votre ancien abonnement'}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  -{formatCents(discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Montant estimé des taxes</span>
              <span className="text-foreground">0,00 €</span>
            </div>

            {promoCode ? (
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  Code <span className="font-mono font-semibold">{promoCode}</span>
                </span>
                <button
                  type="button"
                  onClick={removePromo}
                  disabled={promoBusy}
                  className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  Retirer
                </button>
              </div>
            ) : promoOpen ? (
              <div className="flex items-center gap-1.5">
                <input
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      applyPromo()
                    }
                  }}
                  placeholder="Code promo"
                  autoFocus
                  className="h-8 w-32 rounded-md border border-border bg-transparent px-2.5 text-[13px] font-mono uppercase outline-none transition-colors focus:border-foreground/40"
                />
                <button
                  type="button"
                  onClick={applyPromo}
                  disabled={promoBusy || !promoInput.trim()}
                  style={{ backgroundColor: '#635bff' }}
                  className="flex h-8 items-center justify-center rounded-md px-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {promoBusy ? <Spinner /> : 'Appliquer'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPromoOpen(true)}
                className="text-left text-[13px] font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
              >
                J&apos;ai un code promo
              </button>
            )}

            {promoErr && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-2.5 py-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                <div className="text-[12px] leading-snug">
                  <p className="font-semibold text-foreground">Code non applicable</p>
                  <p className="text-muted-foreground">{promoErr}</p>
                </div>
              </div>
            )}

            <div className="mt-3 flex justify-between font-semibold">
              <span className="text-foreground">Dû aujourd&apos;hui</span>
              <span className="text-foreground">{dueTodayLabel}</span>
            </div>
          </div>
        </div>
      )}

      <hr className="my-6 border-border" />

      <h3 className="mb-4 text-base font-semibold text-foreground">Mode de paiement</h3>

      <PaymentElement options={{ layout: 'tabs' }} />

      {err && (
        <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {err}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-4 text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Spinner /> Paiement en cours…
          </>
        ) : (
          "S'abonner"
        )}
      </button>

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Renouvellement {isAnnual ? 'annuel' : 'mensuel'} jusqu&apos;à annulation.
        {meta ? ` ${formatPlanPrice(fullPrice)} ${isAnnual ? 'par an' : 'par mois'} (TTC) sera facturé. ` : ' '}
        <a href="/legal" target="_blank" rel="noreferrer" className="underline">
          Annuler à tout moment
        </a>{' '}
        via les paramètres. En sélectionnant « S&apos;abonner », vous acceptez nos{' '}
        <a href="/legal" target="_blank" rel="noreferrer" className="underline">
          conditions d&apos;utilisation
        </a>
        , confirmez avoir lu notre{' '}
        <a href="/legal" target="_blank" rel="noreferrer" className="underline">
          politique de confidentialité
        </a>{' '}
        et autorisez Faktur à enregistrer votre mode de paiement et à le débiter.
      </p>
    </form>
  )
}
