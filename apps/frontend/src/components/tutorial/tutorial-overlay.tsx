'use client'

import { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useTutorial } from '@/lib/tutorial-context'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, SkipForward, Wand2, GripVertical } from 'lucide-react'

interface Rect { top: number; left: number; width: number; height: number }

function getRect(el: Element): Rect {
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

function isVisible(el: Element): boolean {
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0 && r.top < window.innerHeight && r.bottom > 0
}

export function TutorialOverlay() {
  const {
    active, currentStep, currentLevel, step, totalStepsInLevel, level,
    nextStep, prevStep, skipLevel, showLevelComplete, showTutorialComplete, showOffer,
  } = useTutorial()
  const pathname = usePathname()

  const [ready, setReady] = useState(false)
  const [targetRect, setTargetRect] = useState<Rect | null>(null)
  const [highlightRects, setHighlightRects] = useState<(Rect & { label: string; pos: string })[]>([])
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })

  // Resolve elements with retry
  useEffect(() => {
    if (!active || !currentStep) { setReady(false); return }
    if (showLevelComplete || showTutorialComplete || showOffer) { setReady(false); return }
    if (currentStep.route && pathname !== currentStep.route) { setReady(false); return }

    let cancelled = false
    let attempts = 0

    function tryResolve() {
      if (cancelled) return

      if (currentStep!.target) {
        const el = document.querySelector(currentStep!.target)
        if (!el && attempts < 30) { attempts++; setTimeout(tryResolve, 150); return }
        if (el && isVisible(el)) setTargetRect(getRect(el)); else setTargetRect(null)
      } else {
        setTargetRect(null)
      }

      if (currentStep!.highlights?.length) {
        const found: (Rect & { label: string; pos: string })[] = []
        for (const h of currentStep!.highlights!) {
          const el = document.querySelector(h.target)
          if (el && isVisible(el)) found.push({ ...getRect(el), label: h.label, pos: h.position || 'right' })
        }
        setHighlightRects(found)
      } else {
        setHighlightRects([])
      }

      setReady(true)
    }

    const timer = setTimeout(tryResolve, 250)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [active, currentStep?.id, pathname, showLevelComplete, showTutorialComplete, showOffer])

  // Track positions on scroll/resize
  const updatePositions = useCallback(() => {
    if (!ready || !currentStep) return
    if (currentStep.target) {
      const el = document.querySelector(currentStep.target)
      if (el && isVisible(el)) setTargetRect(getRect(el))
    }
    if (currentStep.highlights?.length) {
      const found: (Rect & { label: string; pos: string })[] = []
      for (const h of currentStep.highlights) {
        const el = document.querySelector(h.target)
        if (el && isVisible(el)) found.push({ ...getRect(el), label: h.label, pos: h.position || 'right' })
      }
      setHighlightRects(found)
    }
  }, [ready, currentStep])

  useEffect(() => {
    if (!ready) return
    window.addEventListener('scroll', updatePositions, true)
    window.addEventListener('resize', updatePositions)
    return () => {
      window.removeEventListener('scroll', updatePositions, true)
      window.removeEventListener('resize', updatePositions)
    }
  }, [ready, updatePositions])

  // Compute tooltip position
  useLayoutEffect(() => {
    if (!ready || !tooltipRef.current) return
    const tt = tooltipRef.current.getBoundingClientRect()
    const pad = 16

    if (!targetRect) {
      setTooltipPos({
        top: Math.max(pad, (window.innerHeight - tt.height) / 2),
        left: Math.max(pad, (window.innerWidth - tt.width) / 2),
      })
      return
    }

    const pos = currentStep?.position ?? 'bottom'
    let top = 0, left = 0
    if (pos === 'bottom') { top = targetRect.top + targetRect.height + 16; left = targetRect.left + targetRect.width / 2 - tt.width / 2 }
    else if (pos === 'top') { top = targetRect.top - tt.height - 16; left = targetRect.left + targetRect.width / 2 - tt.width / 2 }
    else if (pos === 'right') { top = targetRect.top + targetRect.height / 2 - tt.height / 2; left = targetRect.left + targetRect.width + 16 }
    else if (pos === 'left') { top = targetRect.top + targetRect.height / 2 - tt.height / 2; left = targetRect.left - tt.width - 16 }

    top = Math.max(pad, Math.min(top, window.innerHeight - tt.height - pad))
    left = Math.max(pad, Math.min(left, window.innerWidth - tt.width - pad))
    setTooltipPos({ top, left })
  }, [ready, targetRect, currentStep?.id, currentStep?.position])

  if (!active || !currentStep || !ready) return null
  if (showLevelComplete || showTutorialComplete || showOffer) return null

  const spotPad = 10

  return (
    <>
      {/* Dark overlay — pointer-events:none so user can interact with the page */}
      <motion.div
        key="tutorial-bg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9990] bg-black/40 pointer-events-none"
      />

      {/* Spotlight cutout */}
      {currentStep.spotlight && targetRect && (
        <motion.div
          key={`spot-${currentStep.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed z-[9991] rounded-xl pointer-events-none"
          style={{
            top: targetRect.top - spotPad, left: targetRect.left - spotPad,
            width: targetRect.width + spotPad * 2, height: targetRect.height + spotPad * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
          }}
        />
      )}

      {/* Highlight frames + labels */}
      {highlightRects.map((h, i) => (
        <div key={`hl-group-${i}`}>
          {/* Frame */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="fixed z-[9992] pointer-events-none rounded-lg ring-2 ring-accent/60 ring-offset-2 ring-offset-transparent"
            style={{ top: h.top - 2, left: h.left - 2, width: h.width + 4, height: h.height + 4 }}
          />
          {/* Label */}
          <motion.div
            initial={{ opacity: 0, x: h.pos === 'right' ? -8 : h.pos === 'left' ? 8 : 0, y: h.pos === 'top' ? 8 : h.pos === 'bottom' ? -8 : 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06 }}
            className="fixed z-[9993] pointer-events-none"
            style={{
              top: h.pos === 'bottom' ? h.top + h.height + 8
                 : h.pos === 'top' ? h.top - 28
                 : h.top + h.height / 2 - 11,
              left: h.pos === 'right' ? h.left + h.width + 10
                  : h.pos === 'left' ? h.left - 10
                  : h.left + h.width / 2,
              transform: h.pos === 'left' ? 'translateX(-100%)' : h.pos === 'top' || h.pos === 'bottom' ? 'translateX(-50%)' : undefined,
            }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[11px] font-semibold text-white whitespace-nowrap shadow-lg shadow-accent/25">
              <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
              {h.label}
            </span>
          </motion.div>
        </div>
      ))}

      {/* Draggable Tooltip */}
      <motion.div
        ref={tooltipRef}
        key={`tt-${currentStep.id}`}
        drag
        dragMomentum={false}
        dragElastic={0}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed z-[9996] w-[380px] max-w-[calc(100vw-32px)] cursor-grab active:cursor-grabbing"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        <div className="rounded-2xl bg-overlay shadow-2xl border border-border/20 overflow-hidden">
          {/* Drag handle + Level bar */}
          <div
            className="px-4 py-2 flex items-center justify-between text-xs font-semibold select-none"
            style={{ backgroundColor: `${currentLevel?.color}12`, color: currentLevel?.color }}
          >
            <div className="flex items-center gap-2">
              <GripVertical className="h-3.5 w-3.5 opacity-40" />
              <span>Niv. {level} · {currentLevel?.name}</span>
            </div>
            <span className="text-muted-foreground font-normal">{step + 1}/{totalStepsInLevel}</span>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="text-sm font-bold text-foreground mb-1.5">{currentStep.title}</h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-line">{currentStep.description}</p>

            {currentStep.prefill && (
              <button
                type="button"
                className="mt-3 flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2 text-[13px] font-medium text-accent transition-colors hover:bg-accent/15"
                onClick={() => window.dispatchEvent(new CustomEvent('tutorial:prefill', { detail: { type: currentStep.prefill } }))}
              >
                <Wand2 className="h-3.5 w-3.5" /> Préremplir
              </button>
            )}
          </div>

          {/* Dots */}
          <div className="px-4 pb-2.5 flex items-center justify-center gap-1">
            {Array.from({ length: totalStepsInLevel }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 rounded-full transition-all duration-300',
                  i === step ? 'w-5 bg-accent' : i < step ? 'w-1.5 bg-accent/40' : 'w-1.5 bg-muted-foreground/15'
                )}
              />
            ))}
          </div>

          {/* Nav */}
          <div className="flex items-center justify-between border-t border-border/10 px-3 py-2.5">
            <button
              type="button" onClick={prevStep} disabled={level === 1 && step === 0}
              className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Précédent
            </button>
            <button
              type="button" onClick={skipLevel}
              className="flex items-center gap-1 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <SkipForward className="h-3 w-3" /> Passer
            </button>
            <button
              type="button" onClick={nextStep}
              className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-accent/90 transition-colors"
            >
              {step === totalStepsInLevel - 1 ? 'Terminer' : 'Suivant'}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
