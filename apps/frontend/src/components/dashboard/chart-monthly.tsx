'use client'

import * as React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ChartMonthlyProps {
  title: string
  description: string
  data: { month: string; label: string; [key: string]: any }[]
  dataKey: string
  color: string
  thresholds?: { value: number; label: string; color: string }[]
}

export function ChartMonthly({ title, description, data, dataKey, color, thresholds }: ChartMonthlyProps) {
  const formatCurrency = (value: number) => {
    return (value / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="h-[250px] w-full">
          {data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Aucune donnee disponible
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <defs>
                  <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                />
                {thresholds?.map((t) => (
                  <ReferenceLine
                    key={t.label}
                    y={t.value}
                    stroke={t.color}
                    strokeDasharray="6 3"
                    strokeWidth={1.5}
                    label={{
                      value: t.label,
                      position: 'insideTopRight',
                      fill: t.color,
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                ))}
                <Tooltip
                  cursor={{ fill: 'var(--color-muted)', opacity: 0.3 }}
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.75rem',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: 'var(--color-foreground)',
                  }}
                  formatter={(value: any) => [formatCurrency(Number(value)), title]}
                  labelFormatter={(label) => label}
                />
                <Bar
                  dataKey={dataKey}
                  fill={`url(#fill-${dataKey})`}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
