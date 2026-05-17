'use client'

import { useMemo, type CSSProperties } from 'react'
import { motion, type TargetAndTransition, type Transition } from 'framer-motion'

interface SplittingTextProps {
  text: string
  className?: string
  style?: CSSProperties
  stagger?: number
  delay?: number
  initial?: TargetAndTransition
  animate?: TargetAndTransition
  transition?: Transition
  'aria-hidden'?: boolean | 'true' | 'false'
}

export function SplittingText({
  text,
  className = '',
  style,
  stagger = 0.05,
  delay = 0,
  initial = { opacity: 0, filter: 'blur(10px)' },
  animate = { opacity: 1, filter: 'blur(0px)' },
  transition = { duration: 0.4, ease: 'easeOut' },
  ...rest
}: SplittingTextProps) {
  const chars = useMemo(() => Array.from(text), [text])

  return (
    <motion.span
      className={className}
      style={style}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: delay / 1000,
            staggerChildren: stagger,
          },
        },
      }}
      {...rest}
    >
      {chars.map((ch, i) => (
        <motion.span
          key={`${text}-${i}`}
          variants={{
            hidden: initial,
            visible: { ...animate, transition },
          }}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {ch}
        </motion.span>
      ))}
    </motion.span>
  )
}
