'use client'

import { useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { AlertTriangle, Save, RotateCcw } from 'lucide-react'

interface SaveBarProps {
  /** Whether there are unsaved changes */
  hasChanges: boolean
  /** Whether a save is currently in progress */
  saving: boolean
  /** Whether the last save attempt failed */
  error: string | null
  /** Called when user clicks Save */
  onSave: () => void
  /** Called when user clicks Reset */
  onReset: () => void
}

/**
 * Discord-style floating save bar that appears at the bottom when
 * there are unsaved changes. Shows error state with shake animation.
 * Prevents navigation when changes are unsaved (beforeunload).
 */
export function SaveBar({ hasChanges, saving, error, onSave, onReset }: SaveBarProps) {
  const barRef = useRef<HTMLDivElement>(null)

  // Prevent browser navigation when there are unsaved changes
  useEffect(() => {
    if (!hasChanges) return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasChanges])

  // Shake animation on error
  useEffect(() => {
    if (error && barRef.current) {
      barRef.current.classList.add('animate-shake')
      setTimeout(() => barRef.current?.classList.remove('animate-shake'), 500)
    }
  }, [error])

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    if (!hasChanges) return
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        onSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [hasChanges, onSave])

  return (
    <AnimatePresence>
      {(hasChanges || error) && (
        <motion.div
          ref={barRef}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div
            className={`flex items-center gap-4 rounded-2xl border px-5 py-3 shadow-2xl shadow-black/10 backdrop-blur-xl transition-colors duration-300 ${
              error
                ? 'border-destructive/30 bg-destructive/10'
                : 'border-border/50 bg-card/95'
            }`}
          >
            {error ? (
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p className="text-sm font-medium">Erreur : {error}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Modifications non sauvegard&eacute;es
              </p>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                disabled={saving}
                className="text-muted-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                R&eacute;initialiser
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                disabled={saving}
                className="min-w-[120px]"
              >
                {saving ? (
                  <><Spinner className="h-3.5 w-3.5" /> Sauvegarde...</>
                ) : (
                  <><Save className="h-3.5 w-3.5 mr-1.5" /> Sauvegarder</>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
