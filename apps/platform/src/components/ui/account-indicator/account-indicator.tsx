'use client'

import { X } from 'lucide-react'
import { ShinyRevealText } from '@/components/ui/shiny-reveal-text/shiny-reveal-text'

interface AccountIndicatorProps {
  email: string
  avatarUrl?: string | null
  fallback: string
  onClear?: () => void
  className?: string
}

export function AccountIndicator({
  email,
  avatarUrl,
  fallback,
  onClear,
  className = '',
}: AccountIndicatorProps) {
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 rounded-xl border bg-indigo-500/10 border-indigo-500/25 ${className}`}
    >
      <div className="shrink-0 h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center overflow-hidden">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-5 w-5 rounded-full object-cover"
          />
        ) : (
          <span className="text-xs font-semibold text-white leading-none">
            {fallback}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 text-sm font-medium overflow-hidden">
        <ShinyRevealText
          text={email}
          shinyColor="#5957e8"
          shinyShine="#a5a3f7"
        />
      </div>

      {onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Supprimer l'e-mail"
          className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
