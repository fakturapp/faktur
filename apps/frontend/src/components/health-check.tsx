'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'

export function HealthCheckProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [showError, setShowError] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [checking, setChecking] = useState(false)
  const [errorDetails, setErrorDetails] = useState('')
  const [errorTime, setErrorTime] = useState('')
  const dismissedRef = useRef(false)

  const checkHealth = useCallback(async () => {
    setChecking(true)
    try {
      const { data, error } = await api.get<{ status: string }>('/health')
      if (error || !data || data.status !== 'ok') {
        setErrorDetails(error || 'Réponse inattendue du serveur')
        setErrorTime(new Date().toLocaleTimeString('fr-FR'))
        if (!dismissedRef.current) setShowError(true)
      } else {
        setShowError(false)
        setShowConfirm(false)
        dismissedRef.current = false
      }
    } catch {
      setErrorDetails('Impossible de joindre le serveur')
      setErrorTime(new Date().toLocaleTimeString('fr-FR'))
      if (!dismissedRef.current) setShowError(true)
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    const isCheckoutPath =
      pathname.startsWith('/checkout') ||
      /^\/[a-zA-Z0-9_-]{16,}\/pay\/?$/.test(pathname)
    if (isCheckoutPath) return
    checkHealth()
  }, [pathname, checkHealth])

  const handleRetry = () => {
    setShowConfirm(false)
    checkHealth()
  }

  const handleClose = () => {
    setShowConfirm(true)
  }

  const handleDismiss = () => {
    dismissedRef.current = true
    setShowError(false)
    setShowConfirm(false)
  }

  const handleCancelClose = () => {
    setShowConfirm(false)
  }

  return (
    <>
      {children}

      {}
      <AnimatePresence>
        {showError && !showConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
              className="relative z-10 w-full max-w-lg mx-4 overflow-hidden rounded-2xl border border-red-500/20 bg-card shadow-2xl"
            >
              {}
              <div className="relative from-red-500/10 via-orange-500/5 to-transparent px-6 pt-8 pb-6">
                {}
                <div className="mx-auto mb-5 relative w-16 h-16">
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-full bg-red-500/20"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                    className="absolute inset-0 rounded-full bg-red-500/15"
                  />
                  <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20">
                    <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                  </div>
                </div>

                <h2 className="text-center text-xl font-semibold text-foreground">
                  Services indisponibles
                </h2>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  L'API Faktur ne répond pas. Certaines fonctionnalités peuvent ne pas fonctionner correctement.
                </p>
              </div>

              {}
              <div className="px-6 pb-2">
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Logs
                    </span>
                  </div>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 text-muted-foreground/60">{errorTime}</span>
                      <span className="text-red-400">ERR</span>
                      <span className="text-muted-foreground break-all">
                        GET /health - {errorDetails}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 text-muted-foreground/60">{errorTime}</span>
                      <span className="text-yellow-400">WRN</span>
                      <span className="text-muted-foreground">
                        La connexion au backend a échoué
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {}
              <div className="flex gap-3 px-6 py-5">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                  disabled={checking}
                >
                  Fermer
                </Button>
                <Button
                  className={cn('flex-1', checking && 'opacity-80')}
                  onClick={handleRetry}
                  disabled={checking}
                >
                  {checking ? (
                    <span className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="inline-block"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                        </svg>
                      </motion.span>
                      Vérification...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                      </svg>
                      Réessayer
                    </span>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
              className="relative z-10 w-full max-w-sm mx-4 rounded-2xl border border-yellow-500/20 bg-card p-6 shadow-2xl"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/20">
                <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>

              <h3 className="text-center text-lg font-semibold text-foreground">
                Continuer sans API ?
              </h3>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Le serveur API est actuellement inaccessible. Le site pourrait ne pas fonctionner correctement : authentification, chargement des données, et sauvegardes seront indisponibles.
              </p>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDismiss}
                >
                  Continuer quand même
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleRetry}
                >
                  Réessayer
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
