import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class AnalyticsPages {
  async handle({ request, response }: HttpContext) {
    const period = request.input('period', '7d')
    const startDate = this.getStartDate(period)

    const rows = await db
      .from('analytics_events')
      .where('event_type', 'page_view')
      .where('timestamp', '>=', startDate.toSQL()!)
      .select('page_path')
      .count('* as views')
      .countDistinct('session_id as unique_visitors')
      .select(
        db.raw(
          "AVG(CASE WHEN metadata->>'duration_ms' IS NOT NULL THEN (metadata->>'duration_ms')::numeric ELSE NULL END) as avg_duration"
        )
      )
      .groupBy('page_path')
      .orderBy('views', 'desc')

    const pages = rows.map((row) => ({
      path: row.page_path,
      views: Number(row.views),
      uniqueVisitors: Number(row.unique_visitors),
      avgDuration: row.avg_duration ? Math.round(Number(row.avg_duration)) : 0,
    }))

    return response.ok({ pages })
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
}
