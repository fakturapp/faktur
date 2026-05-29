'use client'

interface Props {
  team: {
    id: string
    name: string
    iconUrl?: string | null
  }
}

export function TeamIdentityCard({ team }: Props) {
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
        <h2 className="text-xl font-bold text-foreground truncate">{team.name}</h2>
      </div>
    </div>
  )
}
