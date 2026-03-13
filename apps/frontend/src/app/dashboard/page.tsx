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
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="px-4 lg:px-6">
          <Skeleton className="h-[340px] rounded-xl" />
        </div>
        <div className="px-4 lg:px-6">
          <Skeleton className="h-64 rounded-xl" />
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
