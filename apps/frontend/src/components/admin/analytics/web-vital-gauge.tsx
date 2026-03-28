'use client'

import { cn } from '@/lib/utils'

interface WebVitalGaugeProps {
  name: string
  value: number
  unit?: string
  distribution: { good: number; needsImprovement: number; poor: number }
  className?: string
}

const thresholds: Record<string, { good: number; poor: number; unit: string }> = {
  LCP: { good: 2500, poor: 4000, unit: 'ms' },
  FID: { good: 100, poor: 300, unit: 'ms' },
  CLS: { good: 0.1, poor: 0.25, unit: '' },
  INP: { good: 200, poor: 500, unit: 'ms' },
  FCP: { good: 1800, poor: 3000, unit: 'ms' },
  TTFB: { good: 800, poor: 1800, unit: 'ms' },
}

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const t = thresholds[name]
  if (!t) return 'good'
  if (value <= t.good) return 'good'
  if (value <= t.poor) return 'needs-improvement'
  return 'poor'
}

const ratingColors = {
  good: 'text-emerald-500',
  'needs-improvement': 'text-yellow-500',
  poor: 'text-red-500',
}

const ratingBgColors = {
  good: 'bg-emerald-500',
  'needs-improvement': 'bg-yellow-500',
  poor: 'bg-red-500',
}

export function WebVitalGauge({ name, value, distribution, className }: WebVitalGaugeProps) {
  const rating = getRating(name, value)
  const t = thresholds[name] || { unit: '' }
  const total = distribution.good + distribution.needsImprovement + distribution.poor

  const formatValue = (v: number) => {
    if (name === 'CLS') return v.toFixed(3)
    if (v >= 1000) return `${(v / 1000).toFixed(1)}s`
    return `${Math.round(v)}${t.unit}`
  }

  return (
    <div className={cn('rounded-xl border border-border bg-card p-4', className)}>
      <div className="text-center mb-3">
        <div className="text-xs text-muted-foreground font-medium mb-1">{name}</div>
        <div className={cn('text-2xl font-bold', ratingColors[rating])}>
          {formatValue(value)}
        </div>
        <div className={cn('text-xs font-medium mt-0.5', ratingColors[rating])}>
          P75
        </div>
      </div>

      {/* Distribution bar */}
      {total > 0 && (
        <div>
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            {distribution.good > 0 && (
              <div
                className="bg-emerald-500 rounded-full"
                style={{ width: `${(distribution.good / total) * 100}%` }}
              />
            )}
            {distribution.needsImprovement > 0 && (
              <div
                className="bg-yellow-500 rounded-full"
                style={{ width: `${(distribution.needsImprovement / total) * 100}%` }}
              />
            )}
            {distribution.poor > 0 && (
              <div
                className="bg-red-500 rounded-full"
                style={{ width: `${(distribution.poor / total) * 100}%` }}
              />
            )}
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {Math.round((distribution.good / total) * 100)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
              {Math.round((distribution.needsImprovement / total) * 100)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {Math.round((distribution.poor / total) * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
