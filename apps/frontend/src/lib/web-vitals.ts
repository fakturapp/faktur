import type { Metric } from 'web-vitals'

type TrackPerformanceFn = (metric: {
  name: string
  value: number
  rating: string
  pagePath?: string
  connectionType?: string
}) => void

export function initWebVitals(trackPerformance: TrackPerformanceFn) {
  if (typeof window === 'undefined') return

  const reportMetric = (metric: Metric) => {
    const nav = (navigator as any).connection
    trackPerformance({
      name: metric.name,
      value: Math.round(metric.value * 1000) / 1000,
      rating: metric.rating,
      pagePath: window.location.pathname,
      connectionType: nav?.effectiveType || nav?.type || undefined,
    })
  }

  import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
    onCLS(reportMetric)
    onFCP(reportMetric)
    onLCP(reportMetric)
    onTTFB(reportMetric)
    onINP(reportMetric)
  }).catch(() => {
    // web-vitals not available
  })
}
