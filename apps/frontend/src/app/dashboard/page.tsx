'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Receipt,
  Users,
  Euro,
  Plus,
  ArrowRight,
  ArrowUpRight,
  Clock,
  ChevronRight,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' },
  }),
}

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

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<RecentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const { data } = await api.get<{ stats: DashboardStats; recent: RecentItem[] }>('/dashboard')
    if (data) {
      setStats(data.stats)
      setRecent(data.recent || [])
    }
    setLoading(false)
  }

  function formatCurrency(cents: number) {
    return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
  }

  const statCards = [
    {
      label: "Chiffre d'affaires",
      value: stats ? formatCurrency(stats.revenue.value) : '0,00 EUR',
      trend: stats?.revenue.trend ?? 0,
      description: 'Total ce mois-ci',
      icon: Euro,
      trendLabel: 'par rapport au mois dernier',
    },
    {
      label: 'Factures',
      value: stats?.invoices.value.toString() ?? '0',
      trend: stats?.invoices.trend ?? 0,
      description: 'Factures ce mois',
      icon: FileText,
      trendLabel: 'par rapport au mois dernier',
    },
    {
      label: 'Devis',
      value: stats?.quotes.value.toString() ?? '0',
      trend: stats?.quotes.trend ?? 0,
      description: 'Devis ce mois',
      icon: Receipt,
      trendLabel: 'par rapport au mois dernier',
    },
    {
      label: 'Clients',
      value: stats?.clients.value.toString() ?? '0',
      trend: stats?.clients.trend ?? 0,
      description: 'Clients actifs',
      icon: Users,
      trendLabel: 'nouveaux ce mois',
    },
  ]

  const statusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'muted' }> = {
    draft: { label: 'Brouillon', variant: 'muted' },
    sent: { label: 'Envoyee', variant: 'default' },
    paid: { label: 'Payee', variant: 'success' },
    overdue: { label: 'En retard', variant: 'destructive' },
    accepted: { label: 'Accepte', variant: 'success' },
    rejected: { label: 'Refuse', variant: 'destructive' },
    pending: { label: 'En attente', variant: 'warning' },
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="text-2xl font-bold text-foreground">
          Bonjour{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''} !
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Voici un apercu de votre activite.
        </p>
      </motion.div>

      {/* Stat cards — matching template pattern */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} variants={fadeUp} custom={i + 1}>
            <Card className="bg-gradient-to-t from-primary/5 to-card">
              <CardHeader className="pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-semibold tabular-nums">
                    {stat.value}
                  </CardTitle>
                  <Badge variant="muted" className="gap-1 font-medium">
                    {stat.trend >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-success" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-destructive" />
                    )}
                    {stat.trend >= 0 ? '+' : ''}{stat.trend}%
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm pt-2">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  {stat.description}
                  {stat.trend >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stat.trendLabel}
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div variants={fadeUp} custom={5}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Actions rapides</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Nouvelle facture', icon: FileText, href: '/dashboard/invoices/new', color: 'bg-primary/10 text-primary' },
            { label: 'Nouveau devis', icon: Receipt, href: '/dashboard/quotes/new', color: 'bg-yellow-500/10 text-yellow-500' },
            { label: 'Nouveau client', icon: Users, href: '/dashboard/clients/create', color: 'bg-blue-500/10 text-blue-500' },
          ].map((action) => (
            <Link key={action.label} href={action.href}>
              <Card className="group cursor-pointer hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.color} transition-colors`}>
                    <Plus className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{action.label}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={fadeUp} custom={6}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Activite recente</h2>
          {recent.length > 0 && (
            <Link href="/dashboard/invoices" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              Tout voir <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        <Card>
          {recent.length === 0 ? (
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
                <FileText className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Aucune activite recente</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Creez votre premiere facture ou devis pour commencer.
              </p>
              <Link href="/dashboard/invoices/new">
                <Button className="mt-4" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Creer une facture
                </Button>
              </Link>
            </CardContent>
          ) : (
            <div className="divide-y divide-border">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-1">Type</div>
                <div className="col-span-2">Numero</div>
                <div className="col-span-3">Client</div>
                <div className="col-span-2">Montant</div>
                <div className="col-span-2">Statut</div>
                <div className="col-span-2 text-right">Date</div>
              </div>

              {/* Rows */}
              {recent.map((item) => {
                const status = statusMap[item.status] || { label: item.status, variant: 'muted' as const }
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    <div className="col-span-1">
                      {item.type === 'invoice' ? (
                        <FileText className="h-4 w-4 text-primary" />
                      ) : (
                        <Receipt className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm font-medium text-foreground">{item.number}</span>
                    </div>
                    <div className="col-span-3">
                      <span className="text-sm text-foreground truncate">{item.clientName}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm font-medium text-foreground tabular-nums">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  )
}
