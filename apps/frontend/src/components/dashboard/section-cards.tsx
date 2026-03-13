'use client'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCard {
  label: string
  value: string
  trend: number
  description: string
  trendLabel: string
}

interface SectionCardsProps {
  cards: StatCard[]
}

export function SectionCards({ cards }: SectionCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((stat) => (
        <Card key={stat.label}>
          <CardHeader>
            <CardDescription>{stat.label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {stat.value}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {stat.trend >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {stat.trend >= 0 ? '+' : ''}{stat.trend}%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {stat.description}
              {stat.trend >= 0 ? (
                <TrendingUp className="size-4" />
              ) : (
                <TrendingDown className="size-4" />
              )}
            </div>
            <div className="text-muted-foreground">
              {stat.trendLabel}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
