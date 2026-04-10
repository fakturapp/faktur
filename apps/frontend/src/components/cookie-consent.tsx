'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { Cookie, X, Shield, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
const STORAGE_KEY = 'faktur_cookie_consent'
const POSITION_KEY = 'faktur_cookie_pos'

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
  const [miniPos, setMiniPos] = useState({ x: 0, y: 0 })
  const constraintsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      const t = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(t)
    } else {
      setShowMiniButton(true)
      try {
        const parsed: ConsentState = JSON.parse(stored)
        setAnalyticsEnabled(parsed.analytics)
      } catch {}
    }
    // Restore saved mini button position
    try {
      const savedPos = localStorage.getItem(POSITION_KEY)
      if (savedPos) {
        const parsed = JSON.parse(savedPos)
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setMiniPos(parsed)
        }
      }
    } catch {}
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

  const isDragging = useRef(false)

  const handleDragStart = () => {
    isDragging.current = true
  }

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const newPos = { x: miniPos.x + info.offset.x, y: miniPos.y + info.offset.y }
    setMiniPos(newPos)
    try {
      localStorage.setItem(POSITION_KEY, JSON.stringify(newPos))
    } catch {}
    // Reset drag flag after a short delay so onClick doesn't fire
    requestAnimationFrame(() => {
      setTimeout(() => { isDragging.current = false }, 0)
    })
  }

  return (
    <>
      {/* Drag constraints (full viewport) */}
      <div ref={constraintsRef} className="fixed inset-0 z-40 pointer-events-none" />

      {/* Mini button to reopen preferences */}
      <AnimatePresence>
        {showMiniButton && !visible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, x: miniPos.x, y: miniPos.y }}
            animate={{ opacity: 1, scale: 1, x: miniPos.x, y: miniPos.y }}
            exit={{ opacity: 0, scale: 0.8 }}
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            dragMomentum={false}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            whileDrag={{ scale: 1.1 }}
            onClick={() => {
              // Ignore click if we just finished dragging
              if (isDragging.current) return
              // Re-read consent from localStorage to ensure toggle is accurate
              try {
                const stored = localStorage.getItem(STORAGE_KEY)
                if (stored) {
                  const parsed: ConsentState = JSON.parse(stored)
                  setAnalyticsEnabled(parsed.analytics)
                }
              } catch {}
              setShowMiniButton(false)
              setVisible(true)
              setShowSettings(true)
            }}
            className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-overlay shadow-overlay hover:bg-surface-hover transition-colors cursor-grab active:cursor-grabbing"
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
            className="fixed bottom-4 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-xl bg-overlay shadow-overlay p-5"
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
                  <Cookie className="h-5 w-5 text-accent" />
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
                    className="flex-1 rounded-lg bg-surface-hover px-3 py-2 text-sm font-medium text-foreground hover:bg-surface transition-colors"
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
                  <Cookie className="h-5 w-5 text-accent" />
                  <h3 className="text-sm font-semibold text-foreground">Préférences cookies</h3>
                </div>

                {/* Essential */}
                <div className="mb-3 rounded-lg bg-surface shadow-surface p-3">
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
                <div className="mb-4 rounded-lg bg-surface shadow-surface p-3">
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
                          'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform',
                          analyticsEnabled ? 'translate-x-4' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Nous aident à comprendre l'utilisation du site pour l'améliorer. Données anonymisées.
                  </p>
                </div>

                <button
                  onClick={handleSavePreferences}
                  className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Enregistrer
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
