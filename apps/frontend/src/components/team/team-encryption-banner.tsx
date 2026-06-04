'use client'

import { useMemo, useState } from 'react'
import { ShieldCheck, X } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { useAuth, type TeamSummary } from '@/lib/auth'
import { TeamEncryptionMigrationModal } from '@/components/team/team-encryption-migration-modal'

const DISMISS_KEY_PREFIX = 'faktur_enc_banner_dismissed_'

function isDismissed(teamId: string): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(DISMISS_KEY_PREFIX + teamId) === '1'
}

function markDismissed(teamId: string) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(DISMISS_KEY_PREFIX + teamId, '1')
}

export function TeamEncryptionBanner() {
  const { user, refreshUser } = useAuth()
  const [openTeam, setOpenTeam] = useState<TeamSummary | null>(null)
  const [dismissedTick, setDismissedTick] = useState(0)

  const pendingTeam = useMemo<TeamSummary | null>(() => {
    if (!user?.teams || user.teams.length === 0) return null
    return (
      user.teams.find(
        (t) => t.id === user.currentTeamId && t.encryptionModeConfirmedAt == null && !isDismissed(t.id)
      ) ??
      user.teams.find((t) => t.encryptionModeConfirmedAt == null && !isDismissed(t.id)) ??
      null
    )
  }, [user, dismissedTick])

  if (!pendingTeam || !user?.onboardingCompleted) return null

  return (
    <>
      <div className="mx-4 mt-4 rounded-xl border border-accent/30 bg-accent-soft/40 p-3 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Configurez le chiffrement de votre équipe « {pendingTeam.name} »
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choisissez entre Mode Privé (bout en bout) et Mode Standard.
          </p>
        </div>
        <Button size="sm" onClick={() => setOpenTeam(pendingTeam)}>
          Configurer
        </Button>
        <Tooltip content="Plus tard — la bannière réapparaîtra à la prochaine connexion">
          <button
            type="button"
            onClick={() => {
              markDismissed(pendingTeam.id)
              setDismissedTick((n) => n + 1)
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-hover"
            aria-label="Plus tard"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </Tooltip>
      </div>

      {openTeam && (
        <TeamEncryptionMigrationModal
          open={!!openTeam}
          teamId={openTeam.id}
          teamName={openTeam.name}
          onClose={() => setOpenTeam(null)}
          onResolved={async () => {
            setOpenTeam(null)
            await refreshUser()
          }}
        />
      )}
    </>
  )
}
