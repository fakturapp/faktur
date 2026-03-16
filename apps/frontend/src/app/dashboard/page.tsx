'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { SectionCards } from '@/components/dashboard/section-cards'
import { ChartRevenue } from '@/components/dashboard/chart-revenue'
import { AddChartSidebar, type ChartKey } from '@/components/dashboard/add-chart-sidebar'
import { ChartMonthly } from '@/components/dashboard/chart-monthly'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { Plus, X } from 'lucide-react'

interface DashboardStats {
  totalInvoiced: { value: number; trend: number; previousValue: number }
  outstanding: { value: number; trend: number }
  totalCollected: { value: number; trend: number; previousValue: number }
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

interface MonthlyDataPoint {
  month: string
  label: string
  subtotal: number
  total: number
  count: number
}

interface MicroDataPoint {
  month: string
  label: string
  subtotal: number
  cumulative: number
  count: number
  thresholdServices: number
  thresholdGoods: number
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

const STORAGE_KEY = 'zenvoice_active_charts'

function loadActiveCharts(): ChartKey[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveActiveCharts(charts: ChartKey[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(charts))
  } catch {}
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<RecentItem[]>([])
  const [chartData, setChartData] = useState<RevenueDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [addChartOpen, setAddChartOpen] = useState(false)
  const [activeCharts, setActiveCharts] = useState<ChartKey[]>(loadActiveCharts)

  // Chart data states
  const [revenueData, setRevenueData] = useState<MonthlyDataPoint[]>([])
  const [collectedData, setCollectedData] = useState<MonthlyDataPoint[]>([])
  const [microData, setMicroData] = useState<MicroDataPoint[]>([])

  useEffect(() => {
    loadDashboard()
  }, [])

  // Fetch chart-specific data when activeCharts changes
  useEffect(() => {
    for (const key of activeCharts) {
      if (key === 'revenue' && revenueData.length === 0) {
        api.get<{ data: MonthlyDataPoint[] }>('/dashboard/charts/revenue').then(({ data }) => {
          if (data?.data) setRevenueData(data.data)
        })
      }
      if (key === 'collected' && collectedData.length === 0) {
        api.get<{ data: MonthlyDataPoint[] }>('/dashboard/charts/collected').then(({ data }) => {
          if (data?.data) setCollectedData(data.data)
        })
      }
      if (key === 'micro' && microData.length === 0) {
        api.get<{ data: MicroDataPoint[] }>('/dashboard/charts/micro-thresholds').then(({ data }) => {
          if (data?.data) setMicroData(data.data)
        })
      }
    }
  }, [activeCharts])

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

  const handleAddChart = useCallback((key: ChartKey) => {
    setActiveCharts((prev) => {
      if (prev.includes(key)) return prev
      const next = [...prev, key]
      saveActiveCharts(next)
      return next
    })
  }, [])

  const handleRemoveChart = useCallback((key: ChartKey) => {
    setActiveCharts((prev) => {
      const next = prev.filter((k) => k !== key)
      saveActiveCharts(next)
      return next
    })
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
          {[...Array(3)].map((_, i) => (
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
      label: 'Total facture',
      value: stats ? formatCurrency(stats.totalInvoiced.value) : '0,00 EUR',
      trend: stats?.totalInvoiced.trend ?? 0,
      description: 'Ce mois-ci',
      trendLabel: 'par rapport au mois dernier',
      previousValue: stats ? `Mois dernier : ${formatCurrency(stats.totalInvoiced.previousValue)}` : undefined,
    },
    {
      label: 'Vos clients vous doivent',
      value: stats ? formatCurrency(stats.outstanding.value) : '0,00 EUR',
      trend: 0,
      description: 'Factures en attente',
      trendLabel: 'envoyees et en retard',
      isSnapshot: true,
    },
    {
      label: 'Total encaisse',
      value: stats ? formatCurrency(stats.totalCollected.value) : '0,00 EUR',
      trend: stats?.totalCollected.trend ?? 0,
      description: 'Ce mois-ci',
      trendLabel: 'par rapport au mois dernier',
      previousValue: stats ? `Mois dernier : ${formatCurrency(stats.totalCollected.previousValue)}` : undefined,
    },
  ]

  const chartLabels: Record<ChartKey, string> = {
    revenue: "Chiffre d'affaires HT",
    collected: "Chiffre d'affaires encaisse",
    micro: 'Seuils de ma micro',
    treasury_variation: 'Variation de la tresorerie',
    treasury_balance: 'Variation et solde de tresorerie',
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Welcome banner */}
      <div className="px-4 lg:px-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">
          Bonjour{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''} !
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Voici un apercu de votre activite.
        </p>
      </div>

      <SectionCards cards={statCards} />

      {/* Mes graphiques section */}
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Mes graphiques</h2>
          <button
            onClick={() => setAddChartOpen(true)}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Default revenue chart (always visible) */}
          <ChartRevenue data={chartData} />

          {/* Dynamic charts */}
          {activeCharts.map((key) => (
            <div key={key} className="relative group">
              <button
                onClick={() => handleRemoveChart(key)}
                className="absolute top-3 right-3 z-10 h-7 w-7 rounded-full bg-card/80 backdrop-blur-sm shadow border border-border flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                title="Retirer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {key === 'revenue' && (
                <ChartMonthly
                  title="Chiffre d'affaires HT"
                  description="CA hors taxes facture par mois (12 mois)"
                  data={revenueData}
                  dataKey="subtotal"
                  color="var(--color-chart-1)"
                />
              )}
              {key === 'collected' && (
                <ChartMonthly
                  title="Chiffre d'affaires encaisse"
                  description="Paiements recus par mois (12 mois)"
                  data={collectedData}
                  dataKey="subtotal"
                  color="var(--color-chart-2)"
                />
              )}
              {key === 'micro' && (
                <ChartMonthly
                  title="Seuils de ma micro"
                  description={`CA cumule vs seuils micro-entrepreneur (${new Date().getFullYear()})`}
                  data={microData}
                  dataKey="cumulative"
                  color="var(--color-chart-5)"
                  thresholds={[
                    { value: 7770000, label: 'Seuil services', color: '#f59e0b' },
                    { value: 18870000, label: 'Seuil marchandises', color: '#ef4444' },
                  ]}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <RecentActivity items={recent} />

      <AddChartSidebar
        open={addChartOpen}
        onClose={() => setAddChartOpen(false)}
        onAddChart={handleAddChart}
        activeCharts={activeCharts}
      />
    </div>
  )
}
