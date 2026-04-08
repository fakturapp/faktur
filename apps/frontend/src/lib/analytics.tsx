'use client'

import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

interface AnalyticsContextValue {
  consentAnalytics: boolean
  updateConsent: (analytics: boolean) => void
  trackEvent: (eventName: string, eventType?: string, metadata?: Record<string, any>) => void
  trackFeature: (featureName: string, metadata?: Record<string, any>) => void
  trackError: (error: { type: string; message: string; messageFull?: string; stack?: string; pagePath?: string }) => void
  trackPerformance: (metric: { name: string; value: number; rating: string; pagePath?: string; connectionType?: string }) => void
}

const AnalyticsContext = createContext<AnalyticsContextValue>({
  consentAnalytics: false,
  updateConsent: () => {},
  trackEvent: () => {},
  trackFeature: () => {},
  trackError: () => {},
  trackPerformance: () => {},
})

export function useAnalyticsContext() {
  return useContext(AnalyticsContext)
}

interface QueuedEvent {
  eventType: string
  eventName: string
  pagePath?: string
  pagePathFull?: string
  metadata?: Record<string, any>
  timestamp: string
}

interface QueuedError {
  errorType: string
  errorMessage: string
  errorMessageFull?: string
  stackTrace?: string
  pagePath?: string
  timestamp: string
}

interface QueuedPerformance {
  metricName: string
  metricValue: number
  rating: string
  pagePath?: string
  connectionType?: string
  timestamp: string
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem('faktur_analytics_session')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('faktur_analytics_session', id)
  }
  return id
}

function getConsent(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem('faktur_cookie_consent')
    if (!raw) return false
    const parsed = JSON.parse(raw)
    return parsed.analytics === true
  } catch {
    return false
  }
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [consentAnalytics, setConsentAnalytics] = useState(false)
  const eventsQueue = useRef<QueuedEvent[]>([])
  const errorsQueue = useRef<QueuedError[]>([])
  const perfQueue = useRef<QueuedPerformance[]>([])
  const flushTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const isFlushing = useRef(false)

  useEffect(() => {
    setConsentAnalytics(getConsent())
  }, [])

  const flush = useCallback(() => {
    if (isFlushing.current) return
    if (!getConsent()) return
    if (eventsQueue.current.length === 0 && errorsQueue.current.length === 0 && perfQueue.current.length === 0) return

    isFlushing.current = true

    const payload = {
      sessionId: getSessionId(),
      consentAnalytics: true,
      screenWidth: window.screen?.width,
      screenHeight: window.screen?.height,
      language: navigator.language?.slice(0, 10),
      referrer: document.referrer || undefined,
      events: eventsQueue.current.splice(0),
      errors: errorsQueue.current.splice(0),
      performance: perfQueue.current.splice(0),
    }

    const body = JSON.stringify(payload)

    if (document.visibilityState === 'hidden') {
      navigator.sendBeacon(`${API_URL}/analytics/ingest`, new Blob([body], { type: 'application/json' }))
      isFlushing.current = false
    } else {
      fetch(`${API_URL}/analytics/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      })
        .catch(() => {})
        .finally(() => {
          isFlushing.current = false
        })
    }
  }, [])

  // Flush every 10s
  useEffect(() => {
    flushTimer.current = setInterval(flush, 10_000)
    return () => {
      if (flushTimer.current) clearInterval(flushTimer.current)
    }
  }, [flush])

  // Flush on visibility change & beforeunload
  useEffect(() => {
    const onVisChange = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    const onBeforeUnload = () => flush()

    document.addEventListener('visibilitychange', onVisChange)
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', onVisChange)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [flush])

  // Listen for consent changes
  useEffect(() => {
    const handler = () => {
      setConsentAnalytics(getConsent())
    }
    window.addEventListener('faktur:consent-changed', handler)
    return () => window.removeEventListener('faktur:consent-changed', handler)
  }, [])

  // Global error handlers
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      trackError({
        type: 'js_error',
        message: event.message?.slice(0, 255) || 'Unknown error',
        messageFull: event.message,
        stack: event.error?.stack,
        pagePath: window.location.pathname,
      })
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || String(event.reason)
      trackError({
        type: 'unhandled_rejection',
        message: msg.slice(0, 255),
        messageFull: msg,
        stack: event.reason?.stack,
        pagePath: window.location.pathname,
      })
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  const trackEvent = useCallback((eventName: string, eventType: string = 'custom', metadata?: Record<string, any>) => {
    if (!getConsent()) return

    const event: QueuedEvent = {
      eventType,
      eventName,
      pagePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
      pagePathFull: typeof window !== 'undefined' ? window.location.pathname : undefined,
      metadata,
      timestamp: new Date().toISOString(),
    }

    eventsQueue.current.push(event)

    // Auto-flush when queue is large
    if (eventsQueue.current.length >= 20) {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(flush)
      } else {
        setTimeout(flush, 0)
      }
    }
  }, [flush])

  const trackFeature = useCallback((featureName: string, metadata?: Record<string, any>) => {
    trackEvent(featureName, 'feature_use', metadata)
  }, [trackEvent])

  const trackError = useCallback((error: { type: string; message: string; messageFull?: string; stack?: string; pagePath?: string }) => {
    if (!getConsent()) return

    errorsQueue.current.push({
      errorType: error.type,
      errorMessage: error.message.slice(0, 255),
      errorMessageFull: error.messageFull,
      stackTrace: error.stack,
      pagePath: error.pagePath || (typeof window !== 'undefined' ? window.location.pathname : undefined),
      timestamp: new Date().toISOString(),
    })
  }, [])

  const trackPerformance = useCallback((metric: { name: string; value: number; rating: string; pagePath?: string; connectionType?: string }) => {
    if (!getConsent()) return

    perfQueue.current.push({
      metricName: metric.name,
      metricValue: metric.value,
      rating: metric.rating,
      pagePath: metric.pagePath || (typeof window !== 'undefined' ? window.location.pathname : undefined),
      connectionType: metric.connectionType,
      timestamp: new Date().toISOString(),
    })
  }, [])

  const updateConsent = useCallback((analytics: boolean) => {
    setConsentAnalytics(analytics)
    if (!analytics) {
      // Clear queues if consent revoked
      eventsQueue.current = []
      errorsQueue.current = []
      perfQueue.current = []
    }
  }, [])

  return (
    <AnalyticsContext.Provider value={{ consentAnalytics, updateConsent, trackEvent, trackFeature, trackError, trackPerformance }}>
      {children}
    </AnalyticsContext.Provider>
  )
}
