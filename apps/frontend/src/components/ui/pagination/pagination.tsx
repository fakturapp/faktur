'use client'

import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}

interface PaginationProps {
  meta: PaginationMeta | null
  onPageChange: (page: number) => void
}

function getPageNumbers(current: number, last: number): (number | 'ellipsis')[] {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = [1]

  if (current > 3) pages.push('ellipsis')

  const start = Math.max(2, current - 1)
  const end = Math.min(last - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < last - 2) pages.push('ellipsis')

  pages.push(last)
  return pages
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (!meta || meta.total <= meta.perPage) return null

  const pages = getPageNumbers(meta.currentPage, meta.lastPage)

  return (
    <div className="flex items-center justify-center gap-1.5 rounded-lg bg-surface p-1.5">
      <button
        onClick={() => onPageChange(meta.currentPage - 1)}
        disabled={meta.currentPage <= 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e${i}`} className="flex h-8 w-8 items-center justify-center text-muted-foreground text-sm">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors',
              p === meta.currentPage
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(meta.currentPage + 1)}
        disabled={meta.currentPage >= meta.lastPage}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
