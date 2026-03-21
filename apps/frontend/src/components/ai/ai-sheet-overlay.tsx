'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, AlertTriangle, RotateCcw, Eye, X } from 'lucide-react'
import { ShinyText } from '@/components/ui/shiny-text'

interface AiSheetOverlayProps {
  open: boolean
  error?: string | null
  onRetry?: () => void
  onDismissError?: () => void
}

export function AiSheetOverlay({ open, error, onRetry, onDismissError }: AiSheetOverlayProps) {
  const [showErrorDetail, setShowErrorDetail] = useState(false)

  const showError = !!error && !open

  return (
    <>
      <AnimatePresence>
        {/* Loading state */}
        {open && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-20 flex items-center justify-center rounded-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />

            <div className="relative flex flex-col items-center">
              {/* Galaxy AI animation */}
              <div className="relative h-24 w-24 mb-5">
                <motion.div
                  className="absolute -inset-4 rounded-full blur-2xl"
                  style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(99,102,241,0.15) 40%, transparent 70%)' }}
                  animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: '1.5px solid transparent',
                    background: 'linear-gradient(0deg, transparent, transparent) padding-box, linear-gradient(135deg, rgba(139,92,246,0.6), rgba(99,102,241,0.1), rgba(59,130,246,0.6)) border-box',
                  }}
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full"
                  style={{
                    border: '1.5px solid transparent',
                    background: 'linear-gradient(0deg, transparent, transparent) padding-box, linear-gradient(225deg, rgba(236,72,153,0.5), rgba(139,92,246,0.1), rgba(99,102,241,0.5)) border-box',
                  }}
                  animate={{ rotate: [360, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-4 rounded-full"
                  style={{
                    border: '1px solid transparent',
                    background: 'linear-gradient(0deg, transparent, transparent) padding-box, linear-gradient(45deg, rgba(59,130,246,0.6), rgba(139,92,246,0.1), rgba(236,72,153,0.6)) border-box',
                  }}
                  animate={{ rotate: [0, -360] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-6 rounded-full"
                  style={{
                    border: '1px solid transparent',
                    background: 'linear-gradient(0deg, transparent, transparent) padding-box, linear-gradient(315deg, rgba(139,92,246,0.5), rgba(236,72,153,0.1), rgba(59,130,246,0.5)) border-box',
                  }}
                  animate={{ rotate: [360, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-8 rounded-full"
                  animate={{
                    background: [
                      'radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(99,102,241,0.2) 50%, transparent 70%)',
                      'radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(59,130,246,0.2) 50%, transparent 70%)',
                      'radial-gradient(circle, rgba(236,72,153,0.4) 0%, rgba(139,92,246,0.2) 50%, transparent 70%)',
                      'radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(99,102,241,0.2) 50%, transparent 70%)',
                    ],
                    scale: [0.9, 1.1, 0.9],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Sparkles className="h-6 w-6 text-purple-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                  </motion.div>
                </div>
                {[...Array(8)].map((_, i) => {
                  const angle = (i * 45 * Math.PI) / 180
                  const radius = 44 + (i % 3) * 6
                  const size = 1.5 + (i % 3) * 0.5
                  const colors = ['bg-purple-400/70', 'bg-indigo-400/70', 'bg-blue-400/70', 'bg-pink-400/70']
                  return (
                    <motion.div
                      key={i}
                      className={`absolute rounded-full ${colors[i % colors.length]}`}
                      style={{ width: size, height: size, top: '50%', left: '50%' }}
                      animate={{
                        x: [0, Math.cos(angle) * radius, Math.cos(angle + 0.5) * (radius * 0.6), 0],
                        y: [0, Math.sin(angle) * radius, Math.sin(angle + 0.5) * (radius * 0.6), 0],
                        opacity: [0, 0.8, 1, 0],
                        scale: [0, 1.2, 0.8, 0],
                      }}
                      transition={{
                        duration: 2.5 + (i % 3) * 0.5,
                        repeat: Infinity,
                        delay: i * 0.25,
                        ease: 'easeInOut',
                      }}
                    />
                  )
                })}
              </div>

              <motion.div
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ShinyText
                  text="Modification en cours..."
                  className="text-base font-semibold"
                  color="#a78bfa"
                  shineColor="#e0e7ff"
                  speed={1.5}
                />
              </motion.div>

              <div className="w-36 h-1 rounded-full bg-muted/30 mt-4 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, rgba(139,92,246,0.8), rgba(99,102,241,0.8), rgba(59,130,246,0.8), rgba(236,72,153,0.8))',
                    backgroundSize: '200% 100%',
                  }}
                  animate={{
                    x: ['-100%', '200%'],
                    backgroundPosition: ['0% 0%', '100% 0%'],
                  }}
                  transition={{
                    x: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                    backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' },
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Error state */}
        {showError && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-20 flex items-center justify-center rounded-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />

            <div className="relative flex flex-col items-center max-w-[280px]">
              {/* Error icon */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 mb-4"
              >
                <AlertTriangle className="h-7 w-7 text-red-400" />
              </motion.div>

              <p className="text-sm font-semibold text-foreground mb-1">Erreur de l&apos;IA</p>
              <p className="text-xs text-muted-foreground text-center mb-4 line-clamp-2">
                {error}
              </p>

              <div className="flex items-center gap-2">
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Réessayer
                  </button>
                )}
                <button
                  onClick={() => setShowErrorDetail(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Détails
                </button>
                <button
                  onClick={onDismissError}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error detail modal */}
      <AnimatePresence>
        {showErrorDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowErrorDetail(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Détails de l&apos;erreur</p>
                  <p className="text-[10px] text-muted-foreground">Réponse du serveur IA</p>
                </div>
                <button
                  onClick={() => setShowErrorDetail(false)}
                  className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <div className="rounded-xl bg-muted/30 border border-border p-3 max-h-[300px] overflow-y-auto">
                <pre className="text-xs text-foreground whitespace-pre-wrap break-words font-mono leading-relaxed">
                  {error}
                </pre>
              </div>

              <div className="flex gap-2 mt-4">
                {onRetry && (
                  <button
                    onClick={() => { setShowErrorDetail(false); onRetry() }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Réessayer
                  </button>
                )}
                <button
                  onClick={() => setShowErrorDetail(false)}
                  className="flex-1 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors text-center"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
