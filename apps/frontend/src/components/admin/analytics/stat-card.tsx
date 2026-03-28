'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  trend?: number
  trendLabel?: string
  icon?: React.ReactNode
  className?: string
}

export function StatCard({ label, value, trend, trendLabel, icon, className }: StatCardProps) {
  const trendDirection = trend && trend > 0 ? 'up' : trend && trend < 0 ? 'down' : 'neutral'

  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="text-2xl font-bold text-foreground">
        {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
      </div>
      {trend !== undefined && (
        <div className="mt-1 flex items-center gap-1">
          {trendDirection === 'up' && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
          {trendDirection === 'down' && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
          {trendDirection === 'neutral' && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
          <span
            className={cn(
              'text-xs font-medium',
              trendDirection === 'up' && 'text-emerald-500',
              trendDirection === 'down' && 'text-red-500',
              trendDirection === 'neutral' && 'text-muted-foreground'
            )}
          >
            {trend > 0 ? '+' : ''}
            {trend.toFixed(1)}%
          </span>
          {trendLabel && <span className="text-xs text-muted-foreground">{trendLabel}</span>}
        </div>
      )}
    </div>
  )
}
