'use client'

import { Crown, Shield, Users } from 'lucide-react'

interface Props {
  team: {
    id: string
    name: string
    iconUrl?: string | null
    memberCount?: number
    role?: 'super_admin' | 'admin' | 'member' | 'viewer' | string
    encryptionMode?: 'private' | 'standard' | null
  }
  intent: 'delete' | 'transfer' | 'leave'
}

const intentMeta: Record<Props['intent'], { label: string; tint: string }> = {
  delete: { label: 'Suppression de l\'équipe', tint: 'bg-destructive/10 text-destructive border-destructive/20' },
  transfer: { label: 'Transfert de propriété', tint: 'bg-primary/10 text-primary border-primary/20' },
  leave: { label: 'Quitter l\'équipe', tint: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
}

export function TeamIdentityCard({ team, intent }: Props) {
  const meta = intentMeta[intent]
  const initial = team.name?.[0]?.toUpperCase() ?? '?'
  return (
    <div className="rounded-2xl border border-border bg-card shadow-surface p-4 flex items-center gap-4">
      {team.iconUrl ? (
        <img
          src={team.iconUrl}
          alt={team.name}
          className="h-14 w-14 rounded-xl object-cover border border-border bg-surface"
        />
      ) : (
        <div className="h-14 w-14 rounded-xl bg-surface-hover flex items-center justify-center text-2xl font-semibold text-muted-foreground">
          {initial}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Vous agissez sur
        </p>
        <h2 className="text-lg font-bold text-foreground truncate">{team.name}</h2>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.tint}`}>
            {meta.label}
          </span>
          {team.role === 'super_admin' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-500 px-2 py-0.5 text-[10px] font-medium">
              <Crown className="h-3 w-3" /> Propriétaire
            </span>
          )}
          {team.role === 'admin' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-400/10 text-indigo-400 px-2 py-0.5 text-[10px] font-medium">
              <Shield className="h-3 w-3" /> Admin
            </span>
          )}
          {typeof team.memberCount === 'number' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-medium">
              <Users className="h-3 w-3" /> {team.memberCount} membre{team.memberCount > 1 ? 's' : ''}
            </span>
          )}
          {team.encryptionMode === 'private' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-500 px-2 py-0.5 text-[10px] font-medium">
              Mode Privé
            </span>
          )}
          {team.encryptionMode === 'standard' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-500 px-2 py-0.5 text-[10px] font-medium">
              Mode Standard
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
