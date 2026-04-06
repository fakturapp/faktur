'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { AlertTriangle, Check, Loader2 } from 'lucide-react'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { saving, saveError } = useInvoiceSettings()

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Save status bar */}
      <AnimatePresence>
        {(saving || saveError) && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div
              className={`flex items-center gap-3 rounded-2xl border px-5 py-3 shadow-2xl shadow-black/10 backdrop-blur-xl transition-colors duration-300 ${
                saveError
                  ? 'border-destructive/30 bg-destructive/10 animate-shake'
                  : 'border-border/50 bg-card/95'
              }`}
            >
              {saveError ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                  <p className="text-sm font-medium text-destructive">Erreur de sauvegarde : {saveError}</p>
                </>
              ) : (
                <>
                  <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                  <p className="text-sm text-muted-foreground">Sauvegarde en cours...</p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
