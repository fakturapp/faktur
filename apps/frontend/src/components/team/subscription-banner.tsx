'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { AlertTriangle, ArrowRight } from 'lucide-react'

export function SubscriptionBanner() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const team = user?.teams?.find((t) => t.id === user.currentTeamId)
  if (!team || team.subscriptionStatus !== 'past_due') return null

  let daysLeft: number | null = null
  if (team.subscriptionGraceEndsAt) {
    const ms = new Date(team.subscriptionGraceEndsAt).getTime() - Date.now()
    daysLeft = Math.max(0, Math.ceil(ms / 86_400_000))
  }

  async function manage() {
    setLoading(true)
    const { data, error } = await api.post<{ url: string }>('/billing/portal', {})
    setLoading(false)
    if (error || !data?.url) {
      toast(error || 'Impossible d’ouvrir la gestion de l’abonnement', 'error')
      return
    }
    window.location.href = data.url
  }

  return (
    <div className="flex items-center gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm">
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
      <p className="flex-1 text-amber-700 dark:text-amber-300">
        Le paiement de l’abonnement de l’équipe «&nbsp;{team.name}&nbsp;» a échoué.
        {daysLeft !== null
          ? ` Il vous reste ${daysLeft} jour${daysLeft > 1 ? 's' : ''} avant le retour au plan Gratuit.`
          : ''}
      </p>
      <button
        onClick={manage}
        disabled={loading}
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-amber-500/90 disabled:opacity-50"
      >
        Régler le paiement <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  )
}
