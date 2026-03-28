'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { motion } from 'framer-motion'
import { DateRangePicker } from '@/components/admin/analytics/date-range-picker'
import { ErrorRow } from '@/components/admin/analytics/error-row'
import { AlertTriangle } from 'lucide-react'

interface ErrorData {
  id: string
  errorType: string
  errorMessage: string
  errorMessageFull?: string
  stackTrace?: string
  pagePath: string
  browser: string
  os: string
  occurrenceCount: number
  isResolved: boolean
  timestamp: string
}

interface ErrorsResponse {
  errors: ErrorData[]
}

export default function AnalyticsErrorsPage() {
  const [period, setPeriod] = useState('7d')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ErrorData[]>([])

  const fetchErrors = useCallback(() => {
    setLoading(true)
    api.get<ErrorsResponse>(`/admin/analytics/errors?period=${period}`).then((res) => {
      if (res.data?.errors) setData(res.data.errors)
      setLoading(false)
    })
  }, [period])

  useEffect(() => {
    fetchErrors()
  }, [fetchErrors])

  const handleResolve = async (id: string) => {
    const res = await api.patch(`/admin/analytics/errors/${id}`, { isResolved: true })
    if (!res.error) {
      setData((prev) =>
        prev.map((e) => (e.id === id ? { ...e, isResolved: true } : e))
      )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" className="text-primary" />
      </div>
    )
  }

  const unresolvedCount = data.filter((e) => !e.isResolved).length
  const resolvedCount = data.filter((e) => e.isResolved).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-foreground">Erreurs</h2>
          {unresolvedCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-500">
              {unresolvedCount} non résolu{unresolvedCount > 1 ? 'es' : 'e'}
            </span>
          )}
          {resolvedCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-500">
              {resolvedCount} résolu{resolvedCount > 1 ? 'es' : 'e'}
            </span>
          )}
        </div>
        <DateRangePicker value={period} onChange={setPeriod} />
      </div>

      {/* Error list */}
      {data.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-12 text-center"
        >
          <AlertTriangle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucune erreur pour cette période</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {data.map((error, i) => (
            <motion.div
              key={error.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <ErrorRow
                id={error.id}
                errorType={error.errorType}
                errorMessage={error.errorMessage}
                errorMessageFull={error.errorMessageFull}
                stackTrace={error.stackTrace}
                pagePath={error.pagePath}
                browser={error.browser}
                os={error.os}
                occurrenceCount={error.occurrenceCount}
                isResolved={error.isResolved}
                timestamp={error.timestamp}
                onResolve={handleResolve}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
