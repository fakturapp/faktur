'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { AlertTriangle, ArrowRight } from 'lucide-react'

export function SubscriptionBanner() {
  const { user } = useAuth()
  const router = useRouter()

  const team = user?.teams?.find((t) => t.id === user.currentTeamId)
  if (!team || team.subscriptionStatus !== 'past_due') return null

  let daysLeft: number | null = null
  if (team.subscriptionGraceEndsAt) {
    const ms = new Date(team.subscriptionGraceEndsAt).getTime() - Date.now()
    daysLeft = Math.max(0, Math.ceil(ms / 86_400_000))
  }

  return (
    <button
      onClick={() => router.push('/dashboard/settings/plan?recover=1')}
      className="flex w-full items-center gap-3 border-b border-amber-500/40 bg-amber-500/15 px-4 py-3 text-left transition-colors hover:bg-amber-500/25"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-amber-800 dark:text-amber-200">
          Paiement en retard sur l’équipe «&nbsp;{team.name}&nbsp;»
        </span>
        <span className="block text-xs text-amber-700/90 dark:text-amber-300/90">
          {daysLeft !== null
            ? `Régularisez sous ${daysLeft} jour${daysLeft > 1 ? 's' : ''} pour éviter le retour au plan Gratuit.`
            : 'Régularisez votre paiement pour conserver votre forfait.'}
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white">
        Régler maintenant <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </button>
  )
}
