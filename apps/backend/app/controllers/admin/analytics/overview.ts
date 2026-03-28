import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import AnalyticsSession from '#models/analytics/analytics_session'
import AnalyticsEvent from '#models/analytics/analytics_event'
import AnalyticsError from '#models/analytics/analytics_error'

export default class AnalyticsOverview {
  async handle({ request, response }: HttpContext) {
    const period = request.input('period', '7d')
    const startDate = this.getStartDate(period)

    const [totalSessions, totalEvents, totalErrors, dau, wau, mau, topPages, heatmap, eventsByDay] =
      await Promise.all([
        AnalyticsSession.query().where('started_at', '>=', startDate.toSQL()!).count('* as total'),
        AnalyticsEvent.query().where('timestamp', '>=', startDate.toSQL()!).count('* as total'),
        AnalyticsError.query().where('timestamp', '>=', startDate.toSQL()!).count('* as total'),
        this.getDau(),
        this.getWau(),
        this.getMau(),
        this.getTopPages(startDate),
        this.getHeatmap(startDate),
        this.getEventsByDay(startDate),
      ])

    return response.ok({
      totalSessions: Number(totalSessions[0].$extras.total),
      totalEvents: Number(totalEvents[0].$extras.total),
      totalErrors: Number(totalErrors[0].$extras.total),
      dau: Number(dau),
      wau: Number(wau),
      mau: Number(mau),
      topPages,
      heatmap,
      eventsByDay,
    })
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

  private async getDau(): Promise<number> {
    const today = DateTime.now().startOf('day')
    const result = await db
      .from('analytics_sessions')
      .where('started_at', '>=', today.toSQL()!)
      .countDistinct('ip_hash as total')
    return Number(result[0].total)
  }

  private async getWau(): Promise<number> {
    const weekAgo = DateTime.now().minus({ days: 7 })
    const result = await db
      .from('analytics_sessions')
      .where('started_at', '>=', weekAgo.toSQL()!)
      .countDistinct('ip_hash as total')
    return Number(result[0].total)
  }

  private async getMau(): Promise<number> {
    const monthAgo = DateTime.now().minus({ days: 30 })
    const result = await db
      .from('analytics_sessions')
      .where('started_at', '>=', monthAgo.toSQL()!)
      .countDistinct('ip_hash as total')
    return Number(result[0].total)
  }

  private async getTopPages(startDate: DateTime) {
    const rows = await db
      .from('analytics_events')
      .where('event_type', 'page_view')
      .where('timestamp', '>=', startDate.toSQL()!)
      .select('page_path')
      .count('* as count')
      .groupBy('page_path')
      .orderBy('count', 'desc')
      .limit(10)

    return rows.map((row) => ({
      pagePath: row.page_path,
      count: Number(row.count),
    }))
  }

  private async getHeatmap(startDate: DateTime) {
    const rows = await db.rawQuery(
      `SELECT
        EXTRACT(dow FROM started_at) AS day,
        EXTRACT(hour FROM started_at) AS hour,
        COUNT(*) AS count
      FROM analytics_sessions
      WHERE started_at >= ?
      GROUP BY EXTRACT(dow FROM started_at), EXTRACT(hour FROM started_at)
      ORDER BY day, hour`,
      [startDate.toSQL()!]
    )

    return rows.rows.map((row: any) => ({
      day: Number(row.day),
      hour: Number(row.hour),
      count: Number(row.count),
    }))
  }

  private async getEventsByDay(startDate: DateTime) {
    const rows = await db
      .from('analytics_events')
      .where('timestamp', '>=', startDate.toSQL()!)
      .select(db.raw("DATE(timestamp) as date"))
      .count('* as count')
      .groupByRaw('DATE(timestamp)')
      .orderBy('date', 'asc')

    return rows.map((row) => ({
      date: row.date,
      count: Number(row.count),
    }))
  }
}
