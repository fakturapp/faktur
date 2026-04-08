'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { AlertTriangle, Save, RotateCcw } from 'lucide-react'

interface SaveBarProps {
  hasChanges: boolean
  saving: boolean
  error: string | null
  onSave: () => void
  onReset: () => void
}

export function SaveBar({ hasChanges, saving, error, onSave, onReset }: SaveBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const [navWarning, setNavWarning] = useState(false)

  useEffect(() => {
    if (error && barRef.current) {
      barRef.current.classList.add('animate-shake')
      setTimeout(() => barRef.current?.classList.remove('animate-shake'), 500)
    }
  }, [error])

  useEffect(() => {
    if (!hasChanges) return

    const beforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', beforeUnload)

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href]')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return
      if (href === window.location.pathname) return

      e.preventDefault()
      e.stopPropagation()
      setNavWarning(true)
      barRef.current?.classList.add('animate-shake')
      setTimeout(() => {
        barRef.current?.classList.remove('animate-shake')
        setNavWarning(false)
      }, 2000)
    }
    document.addEventListener('click', handleClick, true)

    window.history.pushState({ __unsaved: true }, '')
    const handlePop = () => {
      window.history.pushState({ __unsaved: true }, '')
      setNavWarning(true)
      barRef.current?.classList.add('animate-shake')
      setTimeout(() => {
        barRef.current?.classList.remove('animate-shake')
        setNavWarning(false)
      }, 2000)
    }
    window.addEventListener('popstate', handlePop)

    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
      document.removeEventListener('click', handleClick, true)
      window.removeEventListener('popstate', handlePop)
    }
  }, [hasChanges])

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

  const showWarning = navWarning || !!error

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
              showWarning
                ? 'border-destructive/30 bg-destructive/10'
                : 'border-border/50 bg-card/95'
            }`}
          >
            {showWarning ? (
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p className="text-sm font-medium max-w-[320px] truncate">
                  {error ? `Erreur : ${error}` : 'Sauvegardez vos modifications avant de quitter'}
                </p>
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
