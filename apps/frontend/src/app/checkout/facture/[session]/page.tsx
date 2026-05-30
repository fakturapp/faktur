'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText } from 'lucide-react'

export default function SubscriptionCheckoutPage() {
  const params = useParams<{ session: string }>()
  const router = useRouter()
  const sessionId = params?.session

  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const init = useCallback(async () => {
    if (!sessionId) return
    const { data, error } = await api.get<{ clientSecret: string; publishableKey: string }>(
      `/billing/checkout/${sessionId}`
    )
    if (error || !data?.clientSecret) {
      setError(error || 'Session de paiement introuvable')
      setLoading(false)
      return
    }
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || data.publishableKey
    if (!pk) {
      setError('Clé publique Stripe manquante')
      setLoading(false)
      return
    }
    setStripePromise(loadStripe(pk))
    setClientSecret(data.clientSecret)
    setLoading(false)
  }, [sessionId])

  useEffect(() => {
    init()
  }, [init])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[560px] flex-col px-6 pb-16 pt-8">
        <div className="relative mb-8 flex h-10 items-center justify-center">
          <div className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <button
            onClick={() => router.push('/dashboard/settings/plan')}
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
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/dashboard/settings/plan')}
            >
              Retour aux forfaits
            </Button>
          </div>
        ) : stripePromise && clientSecret ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-surface">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        ) : null}
      </div>
    </div>
  )
}
