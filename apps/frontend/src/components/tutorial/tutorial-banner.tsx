'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTutorial } from '@/lib/tutorial-context'
import { TUTORIAL_LEVELS } from '@/components/tutorial/tutorial-steps'
import { cn } from '@/lib/utils'
import { GraduationCap, X, Search, Check, ChevronRight, Lock } from 'lucide-react'

export function TutorialBanner() {
  const { active, level, step, totalStepsInLevel, currentLevel, quitTutorial, goToLevel } = useTutorial()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    function handleEsc(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open])

  if (!active) return null

  const filtered = search.trim()
    ? TUTORIAL_LEVELS.filter((l) =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.subtitle.toLowerCase().includes(search.toLowerCase())
      )
    : TUTORIAL_LEVELS

  return (
    <>
      {/* Floating button */}
      <motion.button
        ref={btnRef}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.4, delay: 0.3 }}
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-6 right-6 z-[9997] flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-colors',
          'bg-accent text-white hover:bg-accent/90',
          open && 'ring-4 ring-accent/20'
        )}
      >
        <GraduationCap className="h-5 w-5" />
        {/* Level badge */}
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
          {level}
        </span>
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full animate-ping bg-accent/20 pointer-events-none" />
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed bottom-20 right-6 z-[9998] w-[280px] rounded-2xl bg-overlay shadow-2xl border border-border/20 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                  <GraduationCap className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground">Didacticiel</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Niveau {level} · {currentLevel?.name} · {step + 1}/{totalStepsInLevel}
                  </p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="px-3 py-2 border-b border-border/10">
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5">
                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Aller au niveau..."
                  className="flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/50 outline-none"
                />
              </div>
            </div>

            {/* Level list */}
            <div className="max-h-[300px] overflow-y-auto p-1.5">
              {filtered.map((lv) => {
                const Icon = lv.icon
                const isCompleted = lv.id < level
                const isCurrent = lv.id === level
                return (
                  <button
                    key={lv.id}
                    type="button"
                    onClick={() => {
                      if (typeof goToLevel === 'function') goToLevel(lv.id)
                      setOpen(false)
                      setSearch('')
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                      isCurrent
                        ? 'bg-accent/10 text-accent'
                        : isCompleted
                        ? 'text-foreground/70 hover:bg-muted/50'
                        : 'text-muted-foreground hover:bg-muted/50'
                    )}
                  >
                    {/* Status icon */}
                    <div
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                        isCurrent && 'ring-2 ring-accent/30'
                      )}
                      style={{ backgroundColor: `${lv.color}12`, color: lv.color }}
                    >
                      {isCompleted ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Icon className="h-3.5 w-3.5" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-[12px] font-medium truncate', isCurrent && 'font-semibold')}>
                        {lv.id}. {lv.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 truncate">{lv.subtitle}</p>
                    </div>

                    {isCurrent && <ChevronRight className="h-3 w-3 text-accent shrink-0" />}
                  </button>
                )
              })}
              {filtered.length === 0 && (
                <p className="text-center text-[12px] text-muted-foreground py-4">Aucun niveau trouvé</p>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border/10 p-2">
              <button
                type="button"
                onClick={() => { quitTutorial(); setOpen(false) }}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
              >
                <X className="h-3 w-3" />
                Quitter le didacticiel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
