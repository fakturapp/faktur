'use client'

import { cn } from '@/lib/utils'

interface DateRangePickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

const options = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
]

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  return (
    <div className={cn('flex rounded-lg border border-border bg-muted/30 p-0.5', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            value === opt.value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
