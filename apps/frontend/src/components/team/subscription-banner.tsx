'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { AlertTriangle } from 'lucide-react'

export function SubscriptionBanner() {
  const { user } = useAuth()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const team = user?.teams?.find((t) => t.id === user.currentTeamId)
  const paused = !!team?.subscriptionPaused
  const pastDue = team?.subscriptionStatus === 'past_due'
  if (!team || (!pastDue && !paused)) return null

  let daysLeft: number | null = null
  if (team.subscriptionGraceEndsAt) {
    const ms = new Date(team.subscriptionGraceEndsAt).getTime() - Date.now()
    daysLeft = Math.max(0, Math.ceil(ms / 86_400_000))
  }

  async function handleClick() {
    if (busy) return
    if (paused) {
      router.push('/dashboard/settings/plan')
      return
    }
    setBusy(true)
    const { data, error } = await api.post<{ url: string }>('/billing/portal', {})
    if (!error && data?.url) {
      window.location.href = data.url
      return
    }
    setBusy(false)
    router.push('/dashboard/settings/plan?recover=1')
  }

  const label = paused
    ? `Abonnement suspendu sur l’équipe « ${team.name} ». Cliquez pour en savoir plus.`
    : daysLeft !== null
      ? `Paiement échoué sur l’équipe « ${team.name} ». Régularisez sous ${daysLeft} jour${daysLeft > 1 ? 's' : ''}, sinon retour au plan Gratuit. Cliquez pour régler.`
      : `Paiement échoué sur l’équipe « ${team.name} ». Cliquez pour régler.`

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-label={label}
      className="flex w-full items-center justify-center gap-2 bg-red-600 px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-white shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-colors hover:bg-red-500 disabled:opacity-70"
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span>{busy ? 'Ouverture du portail Stripe…' : label}</span>
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
    </button>
  )
}
