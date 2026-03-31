'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { FakturAiIcon } from '@/components/icons/faktur-ai-icon'
import {
  Sparkles,
  BarChart3,
  Bell,
  FileCheck,
  MessageSquare,
  Zap,
  Clock,
  CalendarDays,
  ArrowUpRight,
} from 'lucide-react'

const ACTION_ICONS: Record<string, React.ElementType> = {
  generate_text: Sparkles,
  suggest_lines: Zap,
  dashboard_summary: BarChart3,
  generate_reminder: Bell,
  generate_document: FileCheck,
  chat_document: MessageSquare,
}

interface UsageData {
  planName: 'free' | 'ai_pro'
  quota: {
    usageHourly: number
    limitHourly: number
    percentHourly: number
    resetAtHourly: string
    usageWeek: number
    limitWeek: number
    percentWeek: number
    resetAtWeek: string
    percentDisplay: number
  }
  history: Array<{ date: string; count: number }>
  byType: Array<{ type: string; count: number; label: string }>
}

const RechartsUsage = dynamic(
  () =>
    import('recharts').then((mod) => {
      const { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } = mod
      return {
        default: ({ data }: { data: Array<{ date: string; count: number }> }) => (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={data}>
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
                width={30}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelFormatter={(v) =>
                  new Date(String(v)).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                  })
                }
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                name="Requetes IA"
              />
            </LineChart>
          </ResponsiveContainer>
        ),
      }
    }),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 flex items-center justify-center">
        <Spinner size="sm" className="text-primary" />
      </div>
    ),
  }
)

function formatResetTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  const timeStr = d.toLocaleString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (diffMs <= 0) return `Reinitialisation imminente`

  if (hours > 24) {
    const dayStr = d.toLocaleDateString('fr-FR', { weekday: 'long' })
    return `Reinitialisation ${dayStr} a ${timeStr}`
  }

  if (hours > 0) {
    return `Reinitialisation dans ${hours}h${minutes.toString().padStart(2, '0')} (a ${timeStr})`
  }

  return `Reinitialisation dans ${minutes} min (a ${timeStr})`
}

function progressColor(percent: number) {
  if (percent >= 90) return 'bg-red-500'
  if (percent >= 70) return 'bg-yellow-500'
  return 'bg-primary'
}

export default function FakturAiUsagePage() {
  const { user } = useAuth()
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  const plan = user?.plan
  const isFree = !plan || plan.name === 'free'

  useEffect(() => {
    api.get<UsageData>('/billing/usage').then(({ data: d }) => {
      if (d) setData(d)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" className="text-primary" />
      </div>
    )
  }

  if (!data) return null

  const { quota, history, byType } = data

  return (
    <div className="px-4 lg:px-6 py-4 md:py-6 space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <FakturAiIcon className="h-5 w-5 text-primary" />
              Utilisation IA
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Suivi de votre consommation des fonctionnalites IA
            </p>
          </div>
          <Badge variant={isFree ? 'muted' : 'success'}>{isFree ? 'Free' : 'AI Pro'}</Badge>
        </div>
      </motion.div>

      {/* Two quota bars */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* 5h window */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-border bg-card p-5 space-y-3"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Fenetre horaire</span>
          </div>

          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-foreground">
              {quota.usageHourly} <span className="text-sm font-normal text-muted-foreground">/ {quota.limitHourly}</span>
            </p>
            <span className="text-sm font-semibold text-foreground">{quota.percentHourly}%</span>
          </div>

          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(quota.percentHourly, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${progressColor(quota.percentHourly)}`}
            />
          </div>

          <p className="text-[11px] text-muted-foreground">
            {formatResetTime(quota.resetAtHourly)}
          </p>
        </motion.div>

        {/* Weekly window */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-5 space-y-3"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span className="font-medium">Fenetre hebdomadaire</span>
          </div>

          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-foreground">
              {quota.usageWeek} <span className="text-sm font-normal text-muted-foreground">/ {quota.limitWeek}</span>
            </p>
            <span className="text-sm font-semibold text-foreground">{quota.percentWeek}%</span>
          </div>

          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(quota.percentWeek, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${progressColor(quota.percentWeek)}`}
            />
          </div>

          <p className="text-[11px] text-muted-foreground">
            {formatResetTime(quota.resetAtWeek)}
          </p>
        </motion.div>
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border bg-card p-6 space-y-4"
      >
        <h2 className="text-sm font-semibold text-foreground">
          Utilisation sur 30 jours
        </h2>
        <div className="h-64">
          {history.length > 0 ? (
            <RechartsUsage data={history} />
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Aucune donnee disponible
            </div>
          )}
        </div>
      </motion.div>

      {/* By type */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border bg-card p-6 space-y-4"
      >
        <h2 className="text-sm font-semibold text-foreground">
          Detail par fonctionnalite
        </h2>
        {byType.length > 0 ? (
          <div className="space-y-2">
            {byType.map((item) => {
              const Icon = ACTION_ICONS[item.type] || Sparkles
              return (
                <div
                  key={item.type}
                  className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{item.count}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Aucune utilisation enregistree
          </p>
        )}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex items-center justify-between"
      >
        {isFree ? (
          <>
            <div>
              <p className="text-sm font-semibold text-foreground">Passez a AI Pro pour des limites etendues</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                30 req/h et 100 req/semaine au lieu de 5/20.
              </p>
            </div>
            <Link href="/dashboard/upgrade">
              <Button size="sm">
                Passer a AI Pro <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </>
        ) : (
          <>
            <div>
              <p className="text-sm font-semibold text-foreground">Besoin de plus de requetes ?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gerez votre abonnement ou contactez-nous pour des limites personnalisees.
              </p>
            </div>
            <Link href="/dashboard/settings/fakturai/manage">
              <Button variant="outline" size="sm">
                Gerer <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </>
        )}
      </motion.div>
    </div>
  )
}
