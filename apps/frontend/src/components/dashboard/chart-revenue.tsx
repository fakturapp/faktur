'use client'

import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from '@/components/ui/card'

interface RevenueDataPoint {
  date: string
  factures: number
  devis: number
}

interface ChartRevenueProps {
  data: RevenueDataPoint[]
}

const timeRanges = [
  { value: '90d', label: '3 mois' },
  { value: '30d', label: '30 jours' },
  { value: '7d', label: '7 jours' },
]

export function ChartRevenue({ data }: ChartRevenueProps) {
  const [timeRange, setTimeRange] = React.useState('90d')

  const filteredData = React.useMemo(() => {
    if (!data.length) return []
    const now = new Date()
    const daysToSubtract = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return data.filter((item) => new Date(item.date) >= startDate)
  }, [data, timeRange])

  const formatCurrency = (value: number) => {
    return (value / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Chiffre d&apos;affaires</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Evolution sur les {timeRange === '7d' ? '7 derniers jours' : timeRange === '30d' ? '30 derniers jours' : '3 derniers mois'}
          </span>
          <span className="@[540px]/card:hidden">
            {timeRange === '7d' ? '7 jours' : timeRange === '30d' ? '30 jours' : '3 mois'}
          </span>
        </CardDescription>
        <CardAction>
          <div className="hidden @[767px]/card:flex items-center rounded-lg border border-border p-0.5">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  timeRange === range.value
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="@[767px]/card:hidden h-8 rounded-lg border border-border bg-card px-3 text-xs text-foreground"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillFactures" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillDevis" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
                }}
              />
              <Tooltip
                cursor={false}
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '0.75rem',
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: 'var(--color-foreground)',
                }}
                labelFormatter={(value) =>
                  new Date(value).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' })
                }
                formatter={(value, name) => [
                  formatCurrency(Number(value)),
                  name === 'factures' ? 'Factures' : 'Devis',
                ]}
              />
              <Area
                dataKey="devis"
                type="natural"
                fill="url(#fillDevis)"
                stroke="var(--color-chart-2)"
                strokeWidth={2}
                stackId="a"
              />
              <Area
                dataKey="factures"
                type="natural"
                fill="url(#fillFactures)"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                stackId="a"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
