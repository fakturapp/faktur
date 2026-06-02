'use client'

import { useEffect } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'

interface AnimatedPriceProps {
  value: number
  className?: string
  suffix?: string
}

export function AnimatedPrice({ value, className, suffix = ' €' }: AnimatedPriceProps) {
  const count = useMotionValue(value)
  const text = useTransform(count, (v) =>
    v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  )

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.5, ease: [0.22, 1, 0.36, 1] })
    return () => controls.stop()
  }, [value, count])

  return (
    <span className={className}>
      <motion.span>{text}</motion.span>
      {suffix}
    </span>
  )
}
