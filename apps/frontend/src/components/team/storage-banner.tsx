'use client'

import { HardDrive, ArrowRight } from 'lucide-react'

interface StorageInfo {
  totalBytes: number
  quotaBytes: number
  percent: number
  isOver: boolean
  plan: 'free' | 'pro' | 'team'
}

export function StorageBanner({
  storage,
  onOpen,
}: {
  storage: StorageInfo | null
  onOpen: () => void
}) {
  if (!storage || storage.percent < 80) return null

  const remaining = Math.max(0, 100 - storage.percent)
  const full = storage.isOver || remaining <= 0

  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 border-b border-red-500/40 bg-red-500/15 px-4 py-3 text-left transition-colors hover:bg-red-500/25"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/20">
        <HardDrive className="h-5 w-5 text-red-500" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-red-800 dark:text-red-200">
          {full
            ? "Vous n'avez plus d'espace de stockage"
            : `Il vous reste ${remaining}% d'espace de stockage`}
        </span>
        <span className="block text-xs text-red-700/90 dark:text-red-300/90">
          {full
            ? 'Création, modification, duplication et imports sont bloqués. Supprimez des fichiers ou augmentez votre forfait.'
            : 'Pensez à supprimer des fichiers inutilisés ou à augmenter votre forfait avant saturation.'}
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold text-white">
        Gérer <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </button>
  )
}
