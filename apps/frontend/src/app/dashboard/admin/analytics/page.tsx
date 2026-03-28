'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { motion } from 'framer-motion'
import { StatCard } from '@/components/admin/analytics/stat-card'
import { Heatmap } from '@/components/admin/analytics/heatmap'
import { DateRangePicker } from '@/components/admin/analytics/date-range-picker'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity, Zap, AlertTriangle, Users } from 'lucide-react'

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']

interface OverviewData {
  stats: {
    sessions: { value: number; trend: number }
    events: { value: number; trend: number }
    errors: { value: number; trend: number }
    dau: { value: number; trend: number }
  }
  heatmap: Array<{ day: number; hour: number; count: number }>
  topPages: Array<{ path: string; views: number; uniqueVisitors: number }>
  eventsByDay: Array<{ date: string; count: number }>
}

export default function AnalyticsOverviewPage() {
  const [period, setPeriod] = useState('7d')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<OverviewData | null>(null)

  useEffect(() => {
    setLoading(true)
    api.get<OverviewData>(`/admin/analytics/overview?period=${period}`).then((res) => {
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
        <p className="text-sm text-muted-foreground">Impossible de charger les analytiques</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Vue d&apos;ensemble</h2>
        <DateRangePicker value={period} onChange={setPeriod} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <StatCard
            label="Sessions"
            value={data.stats.sessions.value}
            trend={data.stats.sessions.trend}
            trendLabel="vs période préc."
            icon={<Activity className="h-4 w-4" />}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <StatCard
            label="Événements"
            value={data.stats.events.value}
            trend={data.stats.events.trend}
            trendLabel="vs période préc."
            icon={<Zap className="h-4 w-4" />}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard
            label="Erreurs"
            value={data.stats.errors.value}
            trend={data.stats.errors.trend}
            trendLabel="vs période préc."
            icon={<AlertTriangle className="h-4 w-4" />}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <StatCard
            label="DAU"
            value={data.stats.dau.value}
            trend={data.stats.dau.trend}
            trendLabel="vs période préc."
            icon={<Users className="h-4 w-4" />}
          />
        </motion.div>
      </div>

      {/* Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-border bg-card p-5"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">Carte de chaleur des connexions</h3>
        <Heatmap data={data.heatmap} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events by day chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Événements par jour</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.eventsByDay}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) =>
                    new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                  }
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelFormatter={(v: string) =>
                    new Date(v).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                    })
                  }
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2}
                  dot={false}
                  name="Événements"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top pages */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Top 10 pages</h3>
          <div className="space-y-2">
            {data.topPages.slice(0, 10).map((page, i) => (
              <div
                key={page.path}
                className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-b-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-muted-foreground font-mono w-5 shrink-0 text-right">
                    {i + 1}
                  </span>
                  <span className="text-sm text-foreground truncate font-mono">{page.path}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm font-medium text-foreground">
                    {page.views.toLocaleString('fr-FR')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {page.uniqueVisitors.toLocaleString('fr-FR')} uniq.
                  </span>
                </div>
              </div>
            ))}
            {data.topPages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
