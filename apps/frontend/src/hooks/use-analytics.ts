'use client'

import { useCallback } from 'react'
import { useAnalyticsContext } from '@/lib/analytics'

export function useTrackEvent() {
  const { trackEvent } = useAnalyticsContext()
  return trackEvent
}

export function useTrackFeature() {
  const { trackFeature } = useAnalyticsContext()
  return trackFeature
}

export function useTrackError() {
  const { trackError } = useAnalyticsContext()
  return useCallback(
    (type: string, message: string, stack?: string) => {
      trackError({
        type,
        message: message.slice(0, 255),
        messageFull: message,
        stack,
        pagePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
      })
    },
    [trackError]
  )
}
