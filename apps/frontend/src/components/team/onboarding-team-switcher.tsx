'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { Spinner } from '@/components/ui/spinner'
import { Building2, ChevronsUpDown } from '@/components/ui/icons'

export function OnboardingTeamSwitcher() {
  const { user } = useAuth()
  const [switching, setSwitching] = useState(false)

  const teams = user?.teams ?? []
  if (teams.length < 2) return null

  const current = teams.find((t) => t.id === user?.currentTeamId) ?? null

  async function switchTo(teamId: string) {
    if (switching || teamId === user?.currentTeamId) return
    setSwitching(true)
    const { error } = await api.post('/team/switch', { teamId })
    if (error) {
      setSwitching(false)
      return
    }
    window.location.href = '/onboarding'
  }

  return (
    <div className="px-4 pt-3">
      <p className="text-[10px] font-bold text-muted-secondary uppercase tracking-[0.15em] mb-1.5">
        Équipe
      </p>
      <Dropdown
        align="left"
        className="w-[248px]"
        trigger={
          <button
            type="button"
            disabled={switching}
            className="flex w-full items-center gap-2 rounded-xl bg-surface px-3 py-2 text-left text-[12px] font-medium text-foreground transition-colors hover:bg-surface-hover disabled:opacity-60"
          >
            {switching ? (
              <Spinner />
            ) : (
              <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className="flex-1 truncate">{current?.name ?? 'Sélectionner une équipe'}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-secondary" />
          </button>
        }
      >
        {teams.map((t) => (
          <DropdownItem
            key={t.id}
            selected={t.id === user?.currentTeamId}
            onClick={() => switchTo(t.id)}
          >
            <span className="flex flex-1 flex-col">
              <span className="truncate">{t.name}</span>
              <span className="text-[10px] font-normal text-muted-foreground">
                {t.onboardingCompletedAt ? 'Configurée' : 'À configurer'}
              </span>
            </span>
          </DropdownItem>
        ))}
      </Dropdown>
    </div>
  )
}
