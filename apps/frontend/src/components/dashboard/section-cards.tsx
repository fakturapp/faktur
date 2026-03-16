'use client'

import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Wallet } from 'lucide-react'

interface StatCard {
  label: string
  value: string
  trend: number
  description: string
  trendLabel: string
  previousValue?: string
  isSnapshot?: boolean
}

interface SectionCardsProps {
  cards: StatCard[]
}

const cardThemes = [
  { gradient: 'from-indigo-500/15 via-indigo-500/5 to-transparent', accent: 'bg-indigo-500/15 text-indigo-400 ring-indigo-500/20', icon: DollarSign, trendBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' },
  { gradient: 'from-amber-500/15 via-amber-500/5 to-transparent', accent: 'bg-amber-500/15 text-amber-400 ring-amber-500/20', icon: AlertCircle, trendBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  { gradient: 'from-emerald-500/15 via-emerald-500/5 to-transparent', accent: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20', icon: Wallet, trendBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
]

export function SectionCards({ cards }: SectionCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      {cards.map((stat, index) => {
        const theme = cardThemes[index % cardThemes.length]
        const Icon = theme.icon
        return (
          <Card key={stat.label} className={`@container/card relative overflow-hidden bg-gradient-to-br ${theme.gradient}`}>
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {stat.value}
              </CardTitle>
              {!stat.isSnapshot && (
                <CardAction>
                  <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border ${theme.trendBg}`}>
                    {stat.trend >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {stat.trend >= 0 ? '+' : ''}{stat.trend}%
                  </div>
                </CardAction>
              )}
            </CardHeader>
            <div className={`absolute -right-3 -bottom-3 h-20 w-20 rounded-2xl ${theme.accent} ring-1 flex items-center justify-center opacity-20 rotate-12`}>
              <Icon className="h-10 w-10" />
            </div>
          </Card>
        )
      })}
    </div>
  )
}
