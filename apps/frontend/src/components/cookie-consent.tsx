'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X, Shield, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
const STORAGE_KEY = 'faktur_cookie_consent'

interface ConsentState {
  essential: boolean
  analytics: boolean
  timestamp: string
  version: string
}

function getVisitorId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('faktur_visitor_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('faktur_visitor_id', id)
  }
  return id
}

function sendConsent(analytics: boolean, action: string) {
  fetch(`${API_URL}/analytics/consent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consentAnalytics: analytics,
      consentEssential: true,
      action,
      visitorId: getVisitorId(),
    }),
    keepalive: true,
  }).catch(() => {})
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)
  const [showMiniButton, setShowMiniButton] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      // Small delay so the banner doesn't flash immediately
      const t = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(t)
    } else {
      setShowMiniButton(true)
      try {
        const parsed: ConsentState = JSON.parse(stored)
        setAnalyticsEnabled(parsed.analytics)
      } catch {}
    }
  }, [])

  const saveConsent = useCallback((analytics: boolean, action: string) => {
    const consent: ConsentState = {
      essential: true,
      analytics,
      timestamp: new Date().toISOString(),
      version: '1',
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
    setAnalyticsEnabled(analytics)
    setVisible(false)
    setShowSettings(false)
    setShowMiniButton(true)
    sendConsent(analytics, action)
    window.dispatchEvent(new Event('faktur:consent-changed'))
  }, [])

  const handleAcceptAll = () => saveConsent(true, 'accept_all')
  const handleRejectAnalytics = () => saveConsent(false, 'reject_analytics')
  const handleSavePreferences = () => saveConsent(analyticsEnabled, 'update')

  return (
    <>
      {/* Mini button to reopen preferences */}
      <AnimatePresence>
        {showMiniButton && !visible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => {
              setShowMiniButton(false)
              setVisible(true)
              setShowSettings(true)
            }}
            className="fixed bottom-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border shadow-lg hover:bg-muted transition-colors"
            aria-label="Paramètres des cookies"
          >
            <Cookie className="h-4 w-4 text-muted-foreground" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main banner */}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-4 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-5 shadow-xl"
          >
            {/* Close button */}
            <button
              onClick={() => {
                setVisible(false)
                setShowMiniButton(true)
              }}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {!showSettings ? (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <Cookie className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Cookies</h3>
                </div>
                <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                  Nous utilisons des cookies essentiels pour le fonctionnement du site et des cookies analytiques pour améliorer votre expérience.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleAcceptAll}
                    className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Tout accepter
                  </button>
                  <button
                    onClick={handleRejectAnalytics}
                    className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Refuser
                  </button>
                </div>
                <button
                  onClick={() => setShowSettings(true)}
                  className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Personnaliser
                </button>
              </>
            ) : (
              <>
                <div className="mb-4 flex items-center gap-2">
                  <Cookie className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Préférences cookies</h3>
                </div>

                {/* Essential */}
                <div className="mb-3 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-medium text-foreground">Essentiels</span>
                    </div>
                    <span className="text-xs text-emerald-500 font-medium">Toujours actif</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Nécessaires au fonctionnement du site (authentification, sécurité).
                  </p>
                </div>

                {/* Analytics */}
                <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-foreground">Analytiques</span>
                    </div>
                    <button
                      onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                      className={cn(
                        'relative h-5 w-9 rounded-full transition-colors',
                        analyticsEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
                          analyticsEnabled ? 'translate-x-4' : 'translate-x-0.5'
                        )}
                      />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Nous aident à comprendre l'utilisation du site pour l'améliorer. Données anonymisées.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSavePreferences}
                    className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Retour
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
