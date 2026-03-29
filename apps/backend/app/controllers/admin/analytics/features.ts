import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class AnalyticsFeatures {
  async handle({ request, response }: HttpContext) {
    const period = request.input('period', '7d')
    const periodDays = this.getPeriodDays(period)
    const startDate = this.getStartDate(period)
    const previousStartDate = startDate.minus({ days: periodDays })

    const [currentFeatures, previousFeatures] = await Promise.all([
      this.getFeatures(startDate),
      this.getFeatures(previousStartDate, startDate),
    ])

    const previousMap = new Map<string, number>()
    for (const f of previousFeatures) {
      previousMap.set(f.event_name, Number(f.count))
    }

    const features = currentFeatures.map((row) => {
      const currentCount = Number(row.count)
      const previousCount = previousMap.get(row.event_name) || 0
      const trendPercentage =
        previousCount > 0 ? Math.round(((currentCount - previousCount) / previousCount) * 100) : null

      return {
        name: row.event_name,
        count: currentCount,
        uniqueUsers: Number(row.unique_users),
        trend: trendPercentage ?? 0,
      }
    })

    return response.ok({ features })
  }

  private async getFeatures(startDate: DateTime, endDate?: DateTime) {
    const query = db
      .from('analytics_events')
      .where('event_type', 'feature_use')
      .where('timestamp', '>=', startDate.toSQL()!)
      .select('event_name')
      .count('* as count')
      .countDistinct('user_id as unique_users')
      .groupBy('event_name')
      .orderBy('count', 'desc')

    if (endDate) {
      query.where('timestamp', '<', endDate.toSQL()!)
    }

    return query
  }

  private getStartDate(period: string): DateTime {
    const now = DateTime.now()
    switch (period) {
      case '30d':
        return now.minus({ days: 30 })
      case '90d':
        return now.minus({ days: 90 })
      case '7d':
      default:
        return now.minus({ days: 7 })
    }
  }

  private getPeriodDays(period: string): number {
    switch (period) {
      case '30d':
        return 30
      case '90d':
        return 90
      case '7d':
      default:
        return 7
    }
  }
}
