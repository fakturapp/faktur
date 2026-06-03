'use client'

import { HardDrive } from 'lucide-react'

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
      type="button"
      onClick={onOpen}
      aria-label="Espace de stockage — cliquez pour gérer"
      className="flex w-full items-center justify-center gap-2 bg-red-600 px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-white shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-colors hover:bg-red-500"
    >
      <HardDrive className="h-3.5 w-3.5 shrink-0" />
      <span>
        {full
          ? 'Stockage plein — lecture, création et imports bloqués, cliquez pour gérer'
          : `Stockage presque plein — il vous reste ${remaining}%, cliquez pour gérer`}
      </span>
      <HardDrive className="h-3.5 w-3.5 shrink-0" />
    </button>
  )
}
