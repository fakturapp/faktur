'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { FakturAiIcon } from '@/components/icons/faktur-ai-icon'
import {
  Check,
  CreditCard,
  ArrowUpRight,
  Loader2,
} from 'lucide-react'

export default function FakturAiManagePage() {
  const { user, refreshUser } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'canceled'; message: string } | null>(null)
  const [waitingForWebhook, setWaitingForWebhook] = useState(false)
  const pollingRef = useRef(false)

  const plan = user?.plan
  const isAiPro = plan?.name === 'ai_pro'
  const isCanceled = plan?.status === 'canceled'

  // Poll for plan update after successful payment (webhook race condition fix)
  const pollForPlanUpdate = useCallback(async () => {
    if (pollingRef.current) return
    pollingRef.current = true
    setWaitingForWebhook(true)

    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 2000))
      await refreshUser()

      // Re-check plan from billing/status (more reliable than auth/me cache)
      const { data } = await api.get<{ plan: { name: string; status: string } | null }>('/billing/status')
      if (data?.plan?.name === 'ai_pro' && data?.plan?.status === 'active') {
        setWaitingForWebhook(false)
        setToast({ type: 'success', message: 'Abonnement AI Pro active ! Vos limites ont ete etendues.' })
        pollingRef.current = false
        // Final refresh to sync everything
        await refreshUser()
        return
      }
    }

    // If we still haven't got the update after 30s, show a message
    setWaitingForWebhook(false)
    setToast({ type: 'success', message: 'Paiement recu. L\'activation peut prendre quelques instants. Rafraichissez la page.' })
    pollingRef.current = false
  }, [refreshUser])

  useEffect(() => {
    if (searchParams.get('success') === 'true' && !pollingRef.current) {
      pollForPlanUpdate()
    }
    if (searchParams.get('canceled') === 'true') {
      setToast({ type: 'canceled', message: 'Paiement annule.' })
      const timer = setTimeout(() => setToast(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, pollForPlanUpdate])

  // Auto-clear toast after 8s
  useEffect(() => {
    if (toast && !waitingForWebhook) {
      const timer = setTimeout(() => setToast(null), 8000)
      return () => clearTimeout(timer)
    }
  }, [toast, waitingForWebhook])

  async function handleManage() {
    setLoading(true)
    const { data, error } = await api.post<{ url: string }>('/billing/portal', {})
    setLoading(false)
    if (data?.url) {
      window.location.href = data.url
    } else if (error) {
      setToast({ type: 'canceled', message: error })
    }
  }

  async function handleUpgrade() {
    setLoading(true)
    const { data, error } = await api.post<{ url: string }>('/billing/checkout', {})
    setLoading(false)
    if (data?.url) {
      window.location.href = data.url
    } else if (error) {
      setToast({ type: 'canceled', message: error })
    }
  }

  // Waiting for webhook: full-page loading state
  if (waitingForWebhook) {
    return (
      <div className="px-4 lg:px-6 py-4 md:py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-primary/20 bg-card p-12 text-center space-y-5 max-w-lg mx-auto"
        >
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                <FakturAiIcon className="h-8 w-8 text-indigo-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Activation en cours...</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Paiement recu ! Nous activons votre abonnement AI Pro.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Spinner size="sm" className="text-primary" />
            <span>Synchronisation avec Stripe...</span>
          </div>
        </motion.div>
      </div>
    )
  }

  // If no subscription and no success param, show upgrade CTA
  if (!isAiPro && !isCanceled && !searchParams.get('success')) {
    return (
      <div className="px-4 lg:px-6 py-4 md:py-6">
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg px-4 py-3 text-sm font-medium mb-6 ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-8 text-center space-y-4 max-w-lg mx-auto"
        >
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FakturAiIcon className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-foreground">Aucun abonnement actif</h1>
          <p className="text-muted-foreground text-sm">
            Vous utilisez actuellement le plan Gratuit avec des limites reduites.
          </p>
          <div className="rounded-lg bg-muted/30 p-4 space-y-2 text-left">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Plan actuel (Free)</span>
              <span className="font-medium text-foreground">5 req/h, 20 req/sem</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-primary font-medium">AI Pro</span>
              <span className="font-medium text-primary">30 req/h, 100 req/sem</span>
            </div>
          </div>
          <Button onClick={handleUpgrade} disabled={loading} className="w-full">
            {loading ? <Spinner size="sm" /> : <><ArrowUpRight className="h-4 w-4 mr-2" />Passer a AI Pro — 4,99 EUR/mois</>}
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-6 py-4 md:py-6 space-y-6 max-w-2xl">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`rounded-lg px-4 py-3 text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Abonnement</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Gerez votre abonnement Faktur AI Pro</p>
      </div>

      {/* Subscription card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border-2 border-primary/20 bg-card p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
              <FakturAiIcon className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">AI Pro</h2>
              <p className="text-xs text-muted-foreground">4,99 EUR / mois</p>
            </div>
          </div>
          <Badge variant={isCanceled ? 'warning' : 'success'}>
            {isCanceled ? 'Annule' : 'Actif'}
          </Badge>
        </div>

        <div className="rounded-lg bg-muted/30 p-4 space-y-2">
          <p className="text-xs font-medium text-foreground">Limites incluses :</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            <span>30 requetes par heure</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            <span>100 requetes par semaine</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            <span>Toutes les fonctionnalites IA</span>
          </div>
        </div>

        {/* Canceled with grace period notice */}
        {isCanceled && plan?.expiresAt && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-xs space-y-1">
            <p className="text-yellow-600 font-medium">Abonnement annule</p>
            <p className="text-muted-foreground">
              Vous conservez l&apos;acces AI Pro jusqu&apos;au{' '}
              <strong className="text-foreground">
                {new Date(plan.expiresAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>
              . Apres cette date, vos limites passeront a celles du plan Gratuit (5 req/h, 20 req/sem).
            </p>
          </div>
        )}

        <Button onClick={handleManage} disabled={loading} className="w-full">
          {loading ? <Spinner size="sm" /> : <><CreditCard className="h-4 w-4 mr-2" />Gerer mon abonnement</>}
        </Button>
      </motion.div>
    </div>
  )
}
