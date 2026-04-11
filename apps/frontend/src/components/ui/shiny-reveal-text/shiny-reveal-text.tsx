'use client'

import { useEffect, useState } from 'react'
import { SplittingText } from '@/components/ui/splitting-text/splitting-text'
import { ShinyText } from '@/components/ui/shiny-text/shiny-text'

interface ShinyRevealTextProps {
  text: string
  revealColor?: string
  shinyColor?: string
  shinyShine?: string
  className?: string
}

export function ShinyRevealText({
  text,
  revealColor,
  shinyColor = '#5957e8',
  shinyShine = '#a5a3f7',
  className = '',
}: ShinyRevealTextProps) {
  const [phase, setPhase] = useState<'reveal' | 'shiny'>('reveal')

  useEffect(() => {
    setPhase('reveal')
    const revealMs = text.length * 12 + 320
    const t = setTimeout(() => setPhase('shiny'), revealMs)
    return () => clearTimeout(t)
  }, [text])

  const effectiveRevealColor = revealColor ?? shinyColor

  return (
    <span className={`relative inline-block ${className}`}>
      <span className="invisible whitespace-pre" aria-hidden="true">
        {text}
      </span>

      {phase === 'reveal' ? (
        <span className="absolute inset-0 whitespace-pre">
          <SplittingText
            text={text}
            stagger={0.012}
            initial={{ opacity: 0, filter: 'blur(28px)', y: 5 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ color: effectiveRevealColor }}
          />
        </span>
      ) : (
        <span className="absolute inset-0 whitespace-pre">
          <ShinyText text={text} color={shinyColor} shineColor={shinyShine} />
        </span>
      )}
    </span>
  )
}
