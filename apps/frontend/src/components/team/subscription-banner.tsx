'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { AlertTriangle, ArrowRight } from 'lucide-react'

export function SubscriptionBanner() {
  const { user } = useAuth()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const team = user?.teams?.find((t) => t.id === user.currentTeamId)
  if (!team || team.subscriptionStatus !== 'past_due') return null

  let daysLeft: number | null = null
  if (team.subscriptionGraceEndsAt) {
    const ms = new Date(team.subscriptionGraceEndsAt).getTime() - Date.now()
    daysLeft = Math.max(0, Math.ceil(ms / 86_400_000))
  }

  async function handleClick() {
    if (busy) return
    setBusy(true)
    const { data, error } = await api.post<{ url: string }>('/billing/portal', {})
    if (!error && data?.url) {
      window.location.href = data.url
      return
    }
    setBusy(false)
    router.push('/dashboard/settings/plan?recover=1')
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className="flex w-full items-center gap-3 border-b border-red-500/40 bg-red-500/15 px-4 py-3 text-left transition-colors hover:bg-red-500/25 disabled:opacity-70"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/20">
        <AlertTriangle className="h-5 w-5 text-red-500" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-red-800 dark:text-red-200">
          Paiement échoué sur l’équipe «&nbsp;{team.name}&nbsp;»
        </span>
        <span className="block text-xs text-red-700/90 dark:text-red-300/90">
          {daysLeft !== null
            ? `Régularisez sous ${daysLeft} jour${daysLeft > 1 ? 's' : ''} via Stripe, sinon votre abonnement repassera au plan Gratuit.`
            : 'Régularisez votre paiement via Stripe pour conserver votre forfait.'}
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold text-white">
        {busy ? 'Ouverture…' : 'Régler maintenant'} <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </button>
  )
}
