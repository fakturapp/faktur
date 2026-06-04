'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { motion } from 'framer-motion'
import { DateRangePicker } from '@/components/admin/analytics/date-range-picker'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, Layers } from '@/components/ui/icons'

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']

const RechartsBar = dynamic(
  () => import('recharts').then((mod) => {
    const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } = mod
    return {
      default: ({ data }: { data: Array<{ name: string; count: number }> }) => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              width={140}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} name="Utilisations" />
          </BarChart>
        </ResponsiveContainer>
      ),
    }
  }),
  { ssr: false, loading: () => <div className="h-72 flex items-center justify-center"><Spinner size="sm" className="text-primary" /></div> }
)

interface FeatureData {
  name: string
  count: number
  uniqueUsers: number
  trend: number
}

interface FeaturesResponse {
  features: FeatureData[]
}

export default function AnalyticsFeaturesPage() {
  const [period, setPeriod] = useState('7d')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<FeatureData[]>([])

  useEffect(() => {
    setLoading(true)
    api.get<FeaturesResponse>(`/admin/analytics/features?period=${period}`).then((res) => {
      if (res.data?.features) setData(res.data.features)
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

  const chartData = data
    .filter((f) => f.name)
    .slice(0, 10)
    .map((f) => ({
      name: f.name.length > 20 ? f.name.slice(0, 20) + '...' : f.name,
      count: f.count ?? 0,
    }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Utilisation des fonctionnalités</h2>
        <DateRangePicker value={period} onChange={setPeriod} />
      </div>

      {/* Bar chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Top fonctionnalités par utilisation</h3>
          <div className="h-72">
            <RechartsBar data={chartData} />
          </div>
        </motion.div>
      )}

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Fonctionnalité</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Utilisations</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Utilisateurs uniques</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Tendance</th>
              </tr>
            </thead>
            <tbody>
              {data.filter((f) => f.name).map((feature, i) => {
                const safeTrend = typeof feature.trend === 'number' && !Number.isNaN(feature.trend) ? feature.trend : 0
                const trendDirection = safeTrend > 0 ? 'up' : safeTrend < 0 ? 'down' : 'neutral'
                return (
                  <motion.tr
                    key={feature.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-foreground">{feature.name}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-foreground">
                        {(feature.count ?? 0).toLocaleString('fr-FR')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-muted-foreground">
                        {(feature.uniqueUsers ?? 0).toLocaleString('fr-FR')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {trendDirection === 'up' && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
                        {trendDirection === 'down' && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
                        {trendDirection === 'neutral' && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                        <span
                          className={cn(
                            'text-xs font-medium',
                            trendDirection === 'up' && 'text-emerald-500',
                            trendDirection === 'down' && 'text-red-500',
                            trendDirection === 'neutral' && 'text-muted-foreground'
                          )}
                        >
                          {safeTrend > 0 ? '+' : ''}
                          {safeTrend.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
              {data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <Layers className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aucune donnée de fonctionnalités pour cette période</p>
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
