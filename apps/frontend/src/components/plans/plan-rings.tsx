'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { PlanId } from '@/lib/plans'

interface Ring {
  r: number
  w: number
  dash: string
  dur: number
  dir: 1 | -1
  opacity?: number
}

const RINGS: Record<PlanId, Ring[]> = {
  free: [
    { r: 42, w: 3.5, dash: '30 26', dur: 34, dir: 1, opacity: 0.95 },
    { r: 31, w: 3, dash: '16 30', dur: 42, dir: -1, opacity: 0.55 },
  ],
  pro: [
    { r: 44, w: 3.5, dash: '14 12', dur: 24, dir: 1 },
    { r: 33, w: 3.5, dash: '10 11', dur: 30, dir: -1, opacity: 0.9 },
    { r: 22, w: 3, dash: '6 9', dur: 20, dir: 1, opacity: 0.7 },
  ],
  team: [
    { r: 45, w: 3, dash: '8 6', dur: 22, dir: 1 },
    { r: 37, w: 3, dash: '5 7', dur: 28, dir: -1, opacity: 0.92 },
    { r: 28, w: 3, dash: '11 5 4 8', dur: 18, dir: 1, opacity: 0.85 },
    { r: 20, w: 2.5, dash: '4 6', dur: 24, dir: -1, opacity: 0.7 },
    { r: 12, w: 2.5, dash: '3 5', dur: 15, dir: 1, opacity: 0.6 },
  ],
}

export function PlanRings({ tier, className }: { tier: PlanId; className?: string }) {
  const rings = RINGS[tier]
  return (
    <motion.svg
      viewBox="0 0 100 100"
      fill="none"
      className={cn('h-full w-full', className)}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 18 }}
    >
      {rings.map((ring, i) => (
        <motion.circle
          key={i}
          cx={50}
          cy={50}
          r={ring.r}
          stroke="currentColor"
          strokeWidth={ring.w}
          strokeDasharray={ring.dash}
          strokeLinecap="round"
          opacity={ring.opacity ?? 1}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          animate={{ rotate: 360 * ring.dir }}
          transition={{ repeat: Infinity, ease: 'linear', duration: ring.dur }}
        />
      ))}
    </motion.svg>
  )
}
