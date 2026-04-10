'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { ShinyText } from '@/components/ui/shiny-text'

interface AiSheetOverlayProps {
  open: boolean
  error?: string | null
  onRetry?: () => void
  onDismissError?: () => void
}

export function AiSheetOverlay({ open }: AiSheetOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-20 flex items-center justify-center rounded-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

          <div className="relative flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10">
              <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
            </div>

            <div className="flex items-center gap-2.5">
              <Spinner className="h-3.5 w-3.5" />
              <ShinyText
                text="Modification en cours..."
                className="text-sm font-medium"
                color="#a78bfa"
                shineColor="#e0e7ff"
                speed={2}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
