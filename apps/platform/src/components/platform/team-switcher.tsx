'use client'

import { useState } from 'react'
import { Check, ChevronDown, Loader2 } from 'lucide-react'
import { useAuth, type PlatformTeam } from '@/lib/auth'
import { cn } from '@/lib/utils'

export function TeamSwitcher() {
  const { teams, currentTeam, selectTeam } = useAuth()
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)

  if (!currentTeam) return null

  async function handleSelect(team: PlatformTeam) {
    if (team.id === currentTeam?.id) {
      setOpen(false)
      return
    }
    setSwitching(team.id)
    try {
      await selectTeam(team.id)
    } finally {
      setSwitching(null)
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm transition-colors hover:bg-surface-hover"
      >
        <TeamAvatar team={currentTeam} className="size-5" />
        <span className="max-w-[160px] truncate font-medium text-foreground">
          {currentTeam.name}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-border bg-overlay p-2 shadow-overlay">
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Vos équipes ({teams.length})
            </p>
            <ul className="mt-1 max-h-72 space-y-0.5 overflow-y-auto">
              {teams.map((team) => {
                const active = team.id === currentTeam.id
                const isSwitching = switching === team.id
                return (
                  <li key={team.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(team)}
                      disabled={isSwitching}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors',
                        active ? 'bg-accent-soft' : 'hover:bg-surface-hover'
                      )}
                    >
                      <TeamAvatar team={team} className="size-7 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{team.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {team.role} ·{' '}
                          {team.encryptionMode === 'private' ? 'Mode Privé' : 'Mode Standard'}
                        </p>
                      </div>
                      {isSwitching ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : active ? (
                        <Check className="h-4 w-4 text-accent" />
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

function TeamAvatar({
  team,
  className,
}: {
  team: PlatformTeam
  className?: string
}) {
  const initials = team.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center overflow-hidden rounded-md bg-surface text-[10px] font-bold text-foreground',
        className
      )}
    >
      {team.iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={team.iconUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  )
}
