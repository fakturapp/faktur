'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { SectionCards } from '@/components/dashboard/section-cards'
import { ChartRevenue } from '@/components/dashboard/chart-revenue'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'

interface DashboardStats {
  revenue: { value: number; trend: number }
  invoices: { value: number; trend: number }
  quotes: { value: number; trend: number }
  clients: { value: number; trend: number }
}

interface RecentItem {
  id: string
  type: 'invoice' | 'quote'
  number: string
  clientName: string
  amount: number
  status: string
  date: string
}

interface RevenueDataPoint {
  date: string
  factures: number
  devis: number
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<RecentItem[]>([])
  const [chartData, setChartData] = useState<RevenueDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const { data } = await api.get<{
      stats: DashboardStats
      recent: RecentItem[]
      chartData?: RevenueDataPoint[]
    }>('/dashboard')
    if (data) {
      setStats(data.stats)
      setRecent(data.recent || [])
      setChartData(data.chartData || [])
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-5 w-5 rounded" />
              </div>
              <Skeleton className="h-7 w-24 mb-1.5" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
        {/* Chart */}
        <div className="px-4 lg:px-6">
          <div className="rounded-xl border border-border bg-card/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3.5 w-48" />
              </div>
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
            <div className="flex items-end gap-3 h-[240px] pt-4">
              {[40, 65, 45, 80, 55, 70, 50, 85, 60, 75, 45, 90].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end gap-1">
                  <Skeleton className="w-full rounded-t" style={{ height: `${h}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3">
              {['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'].map((_, i) => (
                <Skeleton key={i} className="h-3 w-6" />
              ))}
            </div>
          </div>
        </div>
        {/* Recent activity */}
        <div className="px-4 lg:px-6">
          <div className="rounded-xl border border-border bg-card/50 p-6">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      label: "Chiffre d'affaires",
      value: stats ? formatCurrency(stats.revenue.value) : '0,00 EUR',
      trend: stats?.revenue.trend ?? 0,
      description: 'Total ce mois-ci',
      trendLabel: 'par rapport au mois dernier',
    },
    {
      label: 'Factures',
      value: stats?.invoices.value.toString() ?? '0',
      trend: stats?.invoices.trend ?? 0,
      description: 'Factures ce mois',
      trendLabel: 'par rapport au mois dernier',
    },
    {
      label: 'Devis',
      value: stats?.quotes.value.toString() ?? '0',
      trend: stats?.quotes.trend ?? 0,
      description: 'Devis ce mois',
      trendLabel: 'par rapport au mois dernier',
    },
    {
      label: 'Clients',
      value: stats?.clients.value.toString() ?? '0',
      trend: stats?.clients.trend ?? 0,
      description: 'Clients actifs',
      trendLabel: 'nouveaux ce mois',
    },
  ]

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards cards={statCards} />
      <div className="px-4 lg:px-6">
        <ChartRevenue data={chartData} />
      </div>
      <RecentActivity items={recent} />
    </div>
  )
}
