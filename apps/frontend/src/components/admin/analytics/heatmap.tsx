'use client'

import { cn } from '@/lib/utils'

interface HeatmapProps {
  data: Array<{ day: number; hour: number; count: number }>
  className?: string
}

const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}h`)

function getIntensity(count: number, max: number): string {
  if (max === 0 || count === 0) return 'bg-muted/30'
  const ratio = count / max
  if (ratio >= 0.75) return 'bg-primary/80'
  if (ratio >= 0.5) return 'bg-primary/50'
  if (ratio >= 0.25) return 'bg-primary/30'
  return 'bg-primary/10'
}

export function Heatmap({ data, className }: HeatmapProps) {
  const grid = new Map<string, number>()
  let max = 0

  for (const item of data) {
    const key = `${item.day}-${item.hour}`
    grid.set(key, (grid.get(key) || 0) + item.count)
    const val = grid.get(key)!
    if (val > max) max = val
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="min-w-[600px]">
        {/* Hour labels */}
        <div className="flex mb-1 ml-10">
          {hourLabels.map((h, i) => (
            i % 2 === 0 ? (
              <span key={h} className="text-[10px] text-muted-foreground" style={{ width: `${100 / 24}%` }}>
                {h}
              </span>
            ) : (
              <span key={h} style={{ width: `${100 / 24}%` }} />
            )
          ))}
        </div>

        {/* Grid rows */}
        {dayLabels.map((dayLabel, dayIndex) => (
          <div key={dayLabel} className="flex items-center gap-1 mb-0.5">
            <span className="w-9 text-right text-[10px] text-muted-foreground shrink-0">{dayLabel}</span>
            <div className="flex flex-1 gap-0.5">
              {Array.from({ length: 24 }, (_, hour) => {
                const count = grid.get(`${dayIndex}-${hour}`) || 0
                return (
                  <div
                    key={hour}
                    className={cn(
                      'flex-1 aspect-square rounded-sm transition-colors',
                      getIntensity(count, max)
                    )}
                    title={`${dayLabel} ${hour}h: ${count} session${count !== 1 ? 's' : ''}`}
                  />
                )
              })}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-end gap-1 mt-2">
          <span className="text-[10px] text-muted-foreground mr-1">Moins</span>
          <div className="h-3 w-3 rounded-sm bg-muted/30" />
          <div className="h-3 w-3 rounded-sm bg-primary/10" />
          <div className="h-3 w-3 rounded-sm bg-primary/30" />
          <div className="h-3 w-3 rounded-sm bg-primary/50" />
          <div className="h-3 w-3 rounded-sm bg-primary/80" />
          <span className="text-[10px] text-muted-foreground ml-1">Plus</span>
        </div>
      </div>
    </div>
  )
}
