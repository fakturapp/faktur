'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTutorial } from '@/lib/tutorial-context'
import { getLevel, TUTORIAL_LEVELS } from '@/components/tutorial/tutorial-steps'
import { Button } from '@/components/ui/button'
import { ArrowRight, PartyPopper, Trophy } from 'lucide-react'

function ConfettiPiece({ delay }: { delay: number }) {
  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']
  const color = colors[Math.floor(Math.random() * colors.length)]
  const left = Math.random() * 100
  const size = 5 + Math.random() * 5
  const duration = 1.5 + Math.random() * 2

  return (
    <motion.div
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{ y: window.innerHeight + 50, x: (Math.random() - 0.5) * 200, opacity: 0, rotate: 720 }}
      transition={{ duration, delay, ease: 'easeIn' }}
      className="fixed pointer-events-none z-[10001]"
      style={{ left: `${left}%`, top: -20, width: size, height: size * 1.4, backgroundColor: color, borderRadius: 2 }}
    />
  )
}

export function TutorialLevelComplete() {
  const { showLevelComplete, showTutorialComplete, level, dismissLevelComplete, dismissTutorialComplete } = useTutorial()
  const [confetti, setConfetti] = useState<number[]>([])

  const isComplete = showTutorialComplete
  const isOpen = showLevelComplete || showTutorialComplete

  const currentLevel = getLevel(level)
  const nextLevel = getLevel(level + 1)

  useEffect(() => {
    if (isOpen) {
      setConfetti(Array.from({ length: 35 }, (_, i) => i))
      const t = setTimeout(() => setConfetti([]), 4000)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  if (!isOpen) return null

  const Icon = currentLevel?.icon || Trophy
  const color = currentLevel?.color || '#6366f1'

  return (
    <>
      <AnimatePresence>
        {confetti.map((i) => <ConfettiPiece key={i} delay={i * 0.03} />)}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0.3 }}
          className="w-full max-w-sm rounded-2xl bg-overlay shadow-2xl border border-border/20 overflow-hidden"
        >
          <div className="flex flex-col items-center py-8 px-6 text-center" style={{ background: `linear-gradient(135deg, ${color}12 0%, transparent 100%)` }}>
            {isComplete ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6, delay: 0.2 }}
                className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
                <Trophy className="h-8 w-8 text-white" />
              </motion.div>
            ) : (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.15 }}
                className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg" style={{ backgroundColor: `${color}20`, color }}>
                <Icon className="h-7 w-7" />
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              {isComplete ? (
                <>
                  <div className="flex items-center gap-2 justify-center mb-1">
                    <PartyPopper className="h-4 w-4 text-amber-400" />
                    <h2 className="text-base font-bold text-foreground">Didacticiel terminé !</h2>
                    <PartyPopper className="h-4 w-4 text-amber-400 scale-x-[-1]" />
                  </div>
                  <p className="text-sm text-muted-foreground">Vous maîtrisez Faktur.</p>
                </>
              ) : (
                <>
                  <h2 className="text-base font-bold text-foreground mb-0.5">Niveau {level} terminé</h2>
                  <p className="text-sm text-muted-foreground">{currentLevel?.name}</p>
                </>
              )}
            </motion.div>
          </div>

          <div className="p-4">
            {isComplete ? (
              <p className="text-center text-sm text-muted-foreground mb-3">
                Relancez le didacticiel à tout moment depuis Aide &gt; Didacticiel.
              </p>
            ) : nextLevel ? (
              <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/20 p-2.5 mb-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${nextLevel.color}15`, color: nextLevel.color }}>
                  {(() => { const N = nextLevel.icon; return <N className="h-4 w-4" /> })()}
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Prochain</p>
                  <p className="text-sm font-semibold text-foreground">{nextLevel.name}</p>
                </div>
              </div>
            ) : null}

            <Button className="w-full h-10 gap-2 font-semibold" onClick={isComplete ? dismissTutorialComplete : dismissLevelComplete}>
              {isComplete ? 'Terminer' : <><span>Continuer</span> <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </>
  )
}
