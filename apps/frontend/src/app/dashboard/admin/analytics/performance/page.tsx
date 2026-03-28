'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { motion } from 'framer-motion'
import { DateRangePicker } from '@/components/admin/analytics/date-range-picker'
import { WebVitalGauge } from '@/components/admin/analytics/web-vital-gauge'
import { Gauge, Monitor, Smartphone, Tablet } from 'lucide-react'

interface WebVitalData {
  name: string
  value: number
  distribution: { good: number; needsImprovement: number; poor: number }
}

interface SlowestPage {
  path: string
  lcp: number
  fcp: number
  cls: number
}

interface DeviceBreakdown {
  device: string
  count: number
  percentage: number
}

interface PerformanceResponse {
  webVitals: WebVitalData[]
  slowestPages: SlowestPage[]
  deviceBreakdown: DeviceBreakdown[]
}

const deviceIcons: Record<string, React.ReactNode> = {
  desktop: <Monitor className="h-4 w-4" />,
  mobile: <Smartphone className="h-4 w-4" />,
  tablet: <Tablet className="h-4 w-4" />,
}

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.round(ms)}ms`
}

export default function AnalyticsPerformancePage() {
  const [period, setPeriod] = useState('7d')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PerformanceResponse | null>(null)

  useEffect(() => {
    setLoading(true)
    api.get<PerformanceResponse>(`/admin/analytics/performance?period=${period}`).then((res) => {
      if (res.data) setData(res.data)
      setLoading(false)
    })
  }, [period])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" className="text-primary" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-muted-foreground">Impossible de charger les données de performance</p>
      </div>
    )
  }

  const vitalOrder = ['LCP', 'FID', 'CLS', 'INP', 'FCP', 'TTFB']
  const sortedVitals = vitalOrder
    .map((name) => data.webVitals.find((v) => v.name === name))
    .filter(Boolean) as WebVitalData[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Performance</h2>
        <DateRangePicker value={period} onChange={setPeriod} />
      </div>

      {/* Web Vitals grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {sortedVitals.map((vital, i) => (
          <motion.div
            key={vital.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <WebVitalGauge
              name={vital.name}
              value={vital.value}
              distribution={vital.distribution}
            />
          </motion.div>
        ))}
        {sortedVitals.length === 0 && (
          <div className="col-span-full rounded-xl border border-border bg-card p-12 text-center">
            <Gauge className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aucune donnée de Web Vitals</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slowest pages */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Pages les plus lentes (LCP)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Page</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">LCP</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">FCP</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">CLS</th>
                </tr>
              </thead>
              <tbody>
                {data.slowestPages.map((page, i) => (
                  <motion.tr
                    key={page.path}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 + i * 0.02 }}
                    className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <span className="text-sm text-foreground font-mono truncate block max-w-[200px]">
                        {page.path}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-sm font-medium text-foreground">{formatMs(page.lcp)}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-sm text-muted-foreground">{formatMs(page.fcp)}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-sm text-muted-foreground">{page.cls.toFixed(3)}</span>
                    </td>
                  </motion.tr>
                ))}
                {data.slowestPages.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center">
                      <p className="text-sm text-muted-foreground">Aucune donnée</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Device breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Répartition par appareil</h3>
          <div className="space-y-3">
            {data.deviceBreakdown.map((device, i) => (
              <motion.div
                key={device.device}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.05 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {deviceIcons[device.device.toLowerCase()] || <Monitor className="h-4 w-4" />}
                    </span>
                    <span className="text-sm font-medium text-foreground capitalize">{device.device}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {device.count.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-xs font-medium text-foreground w-10 text-right">
                      {device.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${device.percentage}%` }}
                    transition={{ duration: 0.6, delay: 0.4 + i * 0.05 }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
              </motion.div>
            ))}
            {data.deviceBreakdown.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée d&apos;appareils</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
