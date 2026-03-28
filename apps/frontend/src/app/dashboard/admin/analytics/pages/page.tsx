'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { motion } from 'framer-motion'
import { DateRangePicker } from '@/components/admin/analytics/date-range-picker'
import { FileText } from 'lucide-react'

interface PageData {
  path: string
  views: number
  uniqueVisitors: number
  avgDuration: number
}

interface PagesResponse {
  pages: PageData[]
}

function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${minutes}m ${remaining.toString().padStart(2, '0')}s`
}

export default function AnalyticsPagesPage() {
  const [period, setPeriod] = useState('7d')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PageData[]>([])

  useEffect(() => {
    setLoading(true)
    api.get<PagesResponse>(`/admin/analytics/pages?period=${period}`).then((res) => {
      if (res.data?.pages) setData(res.data.pages)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Pages vues</h2>
        <DateRangePicker value={period} onChange={setPeriod} />
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Page</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Vues</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Visiteurs uniques</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Durée moy.</th>
              </tr>
            </thead>
            <tbody>
              {data.map((page, i) => (
                <motion.tr
                  key={page.path}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm text-foreground font-mono">{page.path}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium text-foreground">
                      {page.views.toLocaleString('fr-FR')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-muted-foreground">
                      {page.uniqueVisitors.toLocaleString('fr-FR')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-muted-foreground">
                      {formatDuration(page.avgDuration)}
                    </span>
                  </td>
                </motion.tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aucune donnée de pages pour cette période</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
