import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class AnalyticsUsers {
  async handle({ request, response }: HttpContext) {
    const period = request.input('period', '7d')
    const startDate = this.getStartDate(period)

    const [
      activeUsersOverTime,
      deviceBreakdown,
      browserBreakdown,
      osBreakdown,
      countryBreakdown,
      authVsAnonymous,
    ] = await Promise.all([
      this.getActiveUsersOverTime(startDate),
      this.getDeviceBreakdown(startDate),
      this.getBrowserBreakdown(startDate),
      this.getOsBreakdown(startDate),
      this.getCountryBreakdown(startDate),
      this.getAuthVsAnonymous(startDate),
    ])

    return response.ok({
      activeUsersOverTime,
      deviceBreakdown,
      browserBreakdown,
      osBreakdown,
      countryBreakdown,
      authVsAnonymous,
    })
  }

  private async getActiveUsersOverTime(startDate: DateTime) {
    const rows = await db.rawQuery(
      `SELECT
        DATE(started_at) AS date,
        COUNT(*) FILTER (WHERE is_authenticated = true) AS authenticated,
        COUNT(*) FILTER (WHERE is_authenticated = false) AS anonymous
      FROM analytics_sessions
      WHERE started_at >= ?
      GROUP BY DATE(started_at)
      ORDER BY date ASC`,
      [startDate.toSQL()!]
    )

    return rows.rows.map((row: any) => ({
      date: row.date,
      authenticated: Number(row.authenticated),
      anonymous: Number(row.anonymous),
    }))
  }

  private async getDeviceBreakdown(startDate: DateTime) {
    const rows = await db
      .from('analytics_sessions')
      .where('started_at', '>=', startDate.toSQL()!)
      .select('device_type')
      .count('* as count')
      .groupBy('device_type')

    const breakdown: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 }
    for (const row of rows) {
      const type = (row.device_type || 'desktop').toLowerCase()
      if (type in breakdown) {
        breakdown[type] = Number(row.count)
      } else {
        breakdown.desktop += Number(row.count)
      }
    }

    return breakdown
  }

  private async getBrowserBreakdown(startDate: DateTime) {
    const rows = await db
      .from('analytics_sessions')
      .where('started_at', '>=', startDate.toSQL()!)
      .whereNotNull('browser')
      .select('browser')
      .count('* as count')
      .groupBy('browser')
      .orderBy('count', 'desc')
      .limit(10)

    return rows.map((row) => ({
      browser: row.browser,
      count: Number(row.count),
    }))
  }

  private async getOsBreakdown(startDate: DateTime) {
    const rows = await db
      .from('analytics_sessions')
      .where('started_at', '>=', startDate.toSQL()!)
      .whereNotNull('os')
      .select('os')
      .count('* as count')
      .groupBy('os')
      .orderBy('count', 'desc')
      .limit(10)

    return rows.map((row) => ({
      os: row.os,
      count: Number(row.count),
    }))
  }

  private async getCountryBreakdown(startDate: DateTime) {
    const rows = await db
      .from('analytics_sessions')
      .where('started_at', '>=', startDate.toSQL()!)
      .whereNotNull('country')
      .select('country')
      .count('* as count')
      .groupBy('country')
      .orderBy('count', 'desc')
      .limit(15)

    return rows.map((row) => ({
      country: row.country,
      count: Number(row.count),
    }))
  }

  private async getAuthVsAnonymous(startDate: DateTime) {
    const rows = await db
      .from('analytics_sessions')
      .where('started_at', '>=', startDate.toSQL()!)
      .select('is_authenticated')
      .count('* as count')
      .groupBy('is_authenticated')

    const result = { authenticated: 0, anonymous: 0 }
    for (const row of rows) {
      if (row.is_authenticated) {
        result.authenticated = Number(row.count)
      } else {
        result.anonymous = Number(row.count)
      }
    }

    return result
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
