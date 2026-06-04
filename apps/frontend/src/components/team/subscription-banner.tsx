'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { AlertTriangle, CreditCard } from '@/components/ui/icons'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export function SubscriptionBanner() {
  const { user } = useAuth()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)

  const team = user?.teams?.find((t) => t.id === user.currentTeamId)
  const paused = !!team?.subscriptionPaused
  const pastDue = team?.subscriptionStatus === 'past_due'
  if (!team || (!pastDue && !paused)) return null

  let daysLeft: number | null = null
  if (team.subscriptionGraceEndsAt) {
    const ms = new Date(team.subscriptionGraceEndsAt).getTime() - Date.now()
    daysLeft = Math.max(0, Math.ceil(ms / 86_400_000))
  }

  const downgradeDate = team.subscriptionGraceEndsAt
    ? new Date(team.subscriptionGraceEndsAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  function handleBannerClick() {
    if (paused) {
      router.push('/dashboard/settings/plan')
      return
    }
    setOpen(true)
  }

  async function retryPayment() {
    if (busy) return
    setBusy(true)
    const { data, error } = await api.post<{ url: string }>('/billing/portal', {})
    if (!error && data?.url) {
      window.location.href = data.url
      return
    }
    setBusy(false)
    setOpen(false)
    router.push('/dashboard/settings/plan?recover=1')
  }

  const label = paused
    ? `Abonnement suspendu sur l’équipe « ${team.name} ». Cliquez pour en savoir plus.`
    : daysLeft !== null
      ? `Paiement échoué sur l’équipe « ${team.name} ». Régularisez sous ${daysLeft} jour${daysLeft > 1 ? 's' : ''}, sinon retour au plan Gratuit. Cliquez pour régler.`
      : `Paiement échoué sur l’équipe « ${team.name} ». Cliquez pour régler.`

  return (
    <>
      <button
        type="button"
        onClick={handleBannerClick}
        aria-label={label}
        className="flex w-full items-center justify-center gap-2 bg-red-600 px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-white shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-colors hover:bg-red-500"
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span>{label}</span>
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      </button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogHeader
          onClose={() => setOpen(false)}
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
        >
          <DialogTitle>Pourquoi votre paiement a échoué</DialogTitle>
          <DialogDescription>
            Le dernier prélèvement de l’abonnement de l’équipe « {team.name} » n’a pas pu être
            effectué.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-foreground">
          <p className="text-muted-foreground">
            C’est souvent dû à une carte expirée, un plafond atteint ou un solde insuffisant. Mettez
            à jour votre moyen de paiement sur Stripe, puis relancez le prélèvement.
          </p>
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-[13px] leading-relaxed text-red-700 dark:text-red-300">
            {downgradeDate ? (
              <>
                Sans régularisation, l’équipe « {team.name} » repassera automatiquement au plan
                Gratuit le <strong>{downgradeDate}</strong>.
              </>
            ) : (
              <>
                Sans régularisation, l’équipe « {team.name} » repassera automatiquement au plan
                Gratuit.
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Fermer
          </Button>
          <Button onClick={retryPayment} disabled={busy}>
            {busy ? (
              <>
                <Spinner /> Ouverture du portail Stripe…
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" /> Réessayer le paiement
              </>
            )}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  )
}
