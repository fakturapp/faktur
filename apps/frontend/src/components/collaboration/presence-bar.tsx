'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { CollaboratorInfo } from '@/hooks/use-collaboration'

interface PresenceBarProps {
  collaborators: CollaboratorInfo[]
  className?: string
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

const MAX_VISIBLE = 4

export function PresenceBar({ collaborators, className }: PresenceBarProps) {
  if (collaborators.length === 0) return null

  const visible = collaborators.slice(0, MAX_VISIBLE)
  const overflow = collaborators.length - MAX_VISIBLE

  return (
    <div className={cn('flex items-center', className)}>
      {/* Stacked avatars */}
      <div className="flex -space-x-2">
        <AnimatePresence mode="popLayout">
          {visible.map((collab, i) => (
            <motion.div
              key={collab.userId}
              initial={{ scale: 0, opacity: 0, x: -8 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0, opacity: 0, x: -8 }}
              transition={{ type: 'spring', bounce: 0.35, duration: 0.45, delay: i * 0.05 }}
              className="group relative"
              style={{ zIndex: MAX_VISIBLE - i }}
            >
              {/* Avatar circle */}
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-[2.5px] ring-card cursor-default transition-all duration-200 group-hover:ring-primary/30 group-hover:scale-110"
                style={{ backgroundColor: collab.color }}
              >
                {collab.avatarUrl ? (
                  <img
                    src={collab.avatarUrl}
                    alt=""
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(collab.fullName, collab.email)
                )}
              </div>

              {/* Pulsing online dot */}
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500 ring-[1.5px] ring-card" />
              </span>

              {/* Tooltip */}
              <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2.5 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-y-0 translate-y-1">
                <div className="whitespace-nowrap rounded-lg bg-zinc-900 px-3 py-2 text-xs text-white shadow-xl dark:bg-zinc-700 border border-white/5">
                  <p className="font-semibold">{collab.fullName ?? collab.email}</p>
                  <p className="text-zinc-400 mt-0.5">
                    {collab.isOwner
                      ? 'Proprietaire'
                      : collab.permission === 'editor'
                        ? 'Peut modifier'
                        : 'Lecture seule'}
                  </p>
                </div>
                {/* Tooltip arrow */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-zinc-900 dark:bg-zinc-700 border-l border-t border-white/5" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Overflow count */}
        {overflow > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground ring-[2.5px] ring-card"
            style={{ zIndex: 0 }}
          >
            +{overflow}
          </motion.div>
        )}
      </div>
    </div>
  )
}
