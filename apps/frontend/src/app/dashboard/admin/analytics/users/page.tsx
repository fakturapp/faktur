'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { motion } from 'framer-motion'
import { DateRangePicker } from '@/components/admin/analytics/date-range-picker'
import { Users } from '@/components/ui/icons'

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
}

const ActiveUsersChart = dynamic(
  () => import('recharts').then((mod) => {
    const { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } = mod
    return {
      default: ({ data }: { data: ActiveUsersDay[] }) => (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false}
              tickFormatter={(v: string) => new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => new Date(String(v)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} />
            <Line type="monotone" dataKey="authenticated" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} name="Authentifiés" />
            <Line type="monotone" dataKey="anonymous" stroke={CHART_COLORS[2]} strokeWidth={2} dot={false} name="Anonymes" />
          </LineChart>
        </ResponsiveContainer>
      ),
    }
  }),
  { ssr: false, loading: () => <div className="h-72 flex items-center justify-center"><Spinner size="sm" className="text-primary" /></div> }
)

const DynamicPieChart = dynamic(
  () => import('recharts').then((mod) => {
    const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } = mod
    return {
      default: ({ data, colors }: { data: Array<{ name: string; value: number }>; colors: string[] }) => (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      ),
    }
  }),
  { ssr: false, loading: () => <div className="h-56 flex items-center justify-center"><Spinner size="sm" className="text-primary" /></div> }
)

const DynamicBarChart = dynamic(
  () => import('recharts').then((mod) => {
    const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } = mod
    return {
      default: ({ data, color }: { data: BreakdownItem[]; color: string }) => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={70} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" fill={color} radius={[0, 4, 4, 0]} name="Sessions" />
          </BarChart>
        </ResponsiveContainer>
      ),
    }
  }),
  { ssr: false, loading: () => <div className="h-56 flex items-center justify-center"><Spinner size="sm" className="text-primary" /></div> }
)

interface ActiveUsersDay {
  date: string
  authenticated: number
  anonymous: number
}

interface BreakdownItem {
  name: string
  count: number
}

interface UsersResponse {
  activeUsersOverTime: ActiveUsersDay[]
  deviceBreakdown: BreakdownItem[]
  authBreakdown: { authenticated: number; anonymous: number }
  topBrowsers: BreakdownItem[]
  topOS: BreakdownItem[]
  topCountries: BreakdownItem[]
}

export default function AnalyticsUsersPage() {
  const [period, setPeriod] = useState('7d')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<UsersResponse | null>(null)

  useEffect(() => {
    setLoading(true)
    api.get<UsersResponse>(`/admin/analytics/users?period=${period}`).then((res) => {
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
        <p className="text-sm text-muted-foreground">Impossible de charger les données utilisateurs</p>
      </div>
    )
  }

  const authPieData = [
    { name: 'Authentifiés', value: data.authBreakdown?.authenticated ?? 0 },
    { name: 'Anonymes', value: data.authBreakdown?.anonymous ?? 0 },
  ]

  const devicePieData = (data.deviceBreakdown || []).map((d) => ({
    name: d.name,
    value: d.count,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Utilisateurs</h2>
        <DateRangePicker value={period} onChange={setPeriod} />
      </div>

      {/* Active users line chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-5"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">Utilisateurs actifs</h3>
        <div className="h-72">
          <ActiveUsersChart data={data.activeUsersOverTime || []} />
        </div>
      </motion.div>

      {/* Pie charts row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Device breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Appareils</h3>
          <div className="h-56">
            <DynamicPieChart data={devicePieData} colors={CHART_COLORS} />
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {devicePieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className="text-xs text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Auth breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Authentifiés vs Anonymes</h3>
          <div className="h-56">
            <DynamicPieChart data={authPieData} colors={[CHART_COLORS[0], CHART_COLORS[3]]} />
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[0] }} />
              <span className="text-xs text-muted-foreground">Authentifiés</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[3] }} />
              <span className="text-xs text-muted-foreground">Anonymes</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bar charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top browsers */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Navigateurs</h3>
          {(data.topBrowsers || []).length > 0 ? (
            <div className="h-56">
              <DynamicBarChart data={data.topBrowsers} color={CHART_COLORS[0]} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-56">
              <p className="text-sm text-muted-foreground">Aucune donnée</p>
            </div>
          )}
        </motion.div>

        {/* Top OS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Systèmes d&apos;exploitation</h3>
          {(data.topOS || []).length > 0 ? (
            <div className="h-56">
              <DynamicBarChart data={data.topOS} color={CHART_COLORS[1]} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-56">
              <p className="text-sm text-muted-foreground">Aucune donnée</p>
            </div>
          )}
        </motion.div>

        {/* Top countries */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Pays</h3>
          {(data.topCountries || []).length > 0 ? (
            <div className="h-56">
              <DynamicBarChart data={data.topCountries} color={CHART_COLORS[4]} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-56">
              <p className="text-sm text-muted-foreground">Aucune donnée</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
