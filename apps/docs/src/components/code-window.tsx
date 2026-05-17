import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface Props {
  language?: string
  filename?: string
  children: ReactNode
  className?: string
}

export function CodeWindow({ language, filename, children, className }: Props) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-code-bg shadow-surface',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-separator bg-surface px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="text-[11px] font-medium text-muted-foreground">
          {filename ?? language ?? ''}
        </div>
        <div className="w-12" />
      </div>
      <pre className="overflow-x-auto p-4 text-[12.5px] leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  )
}
