'use client'

import { cn } from '@/lib/utils'

interface TooltipProps {
  content: string
  children: React.ReactNode
  className?: string
}

export function Tooltip({ content, children, className }: TooltipProps) {
  return (
    <span className={cn('relative group inline-flex', className)}>
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-[11px] leading-snug whitespace-normal max-w-[220px] text-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg">
        {content}
      </span>
    </span>
  )
}
