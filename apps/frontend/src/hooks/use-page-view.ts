'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAnalyticsContext } from '@/lib/analytics'

export function usePageView() {
  const pathname = usePathname()
  const { trackEvent, consentAnalytics } = useAnalyticsContext()
  const prevPath = useRef<string | null>(null)

  useEffect(() => {
    if (!consentAnalytics) return
    if (pathname === prevPath.current) return

    prevPath.current = pathname
    trackEvent('page_view', 'page_view', { path: pathname })
  }, [pathname, consentAnalytics, trackEvent])
}
