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
  {
    gradient: 'from-accent-soft/80 via-accent-soft/30 to-transparent',
    accent: 'bg-accent-soft text-accent ring-accent/20',
    icon: DollarSign,
    trendBg: 'bg-accent-soft text-accent-soft-foreground',
  },
  {
    gradient: 'from-warning-soft/80 via-warning-soft/30 to-transparent',
    accent: 'bg-warning-soft text-warning ring-warning/20',
    icon: AlertCircle,
    trendBg: 'bg-warning-soft text-warning-soft-foreground',
  },
  {
    gradient: 'from-success-soft/80 via-success-soft/30 to-transparent',
    accent: 'bg-success-soft text-success ring-success/20',
    icon: Wallet,
    trendBg: 'bg-success-soft text-success-soft-foreground',
  },
]

export function SectionCards({ cards }: SectionCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      {cards.map((stat, index) => {
        const theme = cardThemes[index % cardThemes.length]
        const Icon = theme.icon
        return (
          <Card key={stat.label} className={`@container/card relative overflow-hidden bg-gradient-to-br ${theme.gradient} shadow-sm`}>
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
            <div className={`absolute -right-3 -bottom-3 h-20 w-20 rounded-xl ${theme.accent} ring-1 flex items-center justify-center opacity-15 rotate-12`}>
              <Icon className="h-10 w-10" />
            </div>
          </Card>
        )
      })}
    </div>
  )
}
