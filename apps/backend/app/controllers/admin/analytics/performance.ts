import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class AnalyticsPerformance {
  async handle({ request, response }: HttpContext) {
    const period = request.input('period', '7d')
    const startDate = this.getStartDate(period)
    const metricNames = ['LCP', 'FID', 'CLS', 'INP', 'FCP', 'TTFB']

    const [p75Results, distributionResults, slowestPages, deviceRows] = await Promise.all([
      this.getP75(startDate, metricNames),
      this.getDistribution(startDate, metricNames),
      this.getSlowestPages(startDate),
      this.getDeviceBreakdown(startDate),
    ])

    // Build webVitals array
    const webVitals = metricNames
      .map((name) => {
        const p75Row = p75Results.find((r: any) => r.metric_name === name)
        const distRows = distributionResults.filter((r: any) => r.metric_name === name)

        const distribution = { good: 0, needsImprovement: 0, poor: 0 }
        for (const d of distRows) {
          if (d.rating === 'good') distribution.good = Number(d.count)
          else if (d.rating === 'needs-improvement') distribution.needsImprovement = Number(d.count)
          else if (d.rating === 'poor') distribution.poor = Number(d.count)
        }

        const value = p75Row ? Number(p75Row.p75) : null
        if (value === null && distribution.good === 0 && distribution.needsImprovement === 0 && distribution.poor === 0) {
          return null
        }

        return { name, value: value ?? 0, distribution }
      })
      .filter(Boolean)

    // Build deviceBreakdown with percentages
    const totalDeviceCount = deviceRows.reduce((sum: number, r: any) => sum + Number(r.count), 0)
    const deviceBreakdown = deviceRows.map((row: any) => ({
      device: row.device_type || 'unknown',
      count: Number(row.count),
      percentage: totalDeviceCount > 0 ? Math.round((Number(row.count) / totalDeviceCount) * 100 * 10) / 10 : 0,
    }))

    return response.ok({ webVitals, slowestPages, deviceBreakdown })
  }

  private async getP75(startDate: DateTime, metricNames: string[]) {
    const result = await db.rawQuery(
      `SELECT
        metric_name,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY metric_value) AS p75
      FROM analytics_performance
      WHERE timestamp >= ?
        AND metric_name = ANY(?)
      GROUP BY metric_name`,
      [startDate.toSQL()!, metricNames]
    )
    return result.rows
  }

  private async getDistribution(startDate: DateTime, metricNames: string[]) {
    const result = await db.rawQuery(
      `SELECT
        metric_name,
        rating,
        COUNT(*) AS count
      FROM analytics_performance
      WHERE timestamp >= ?
        AND metric_name = ANY(?)
      GROUP BY metric_name, rating`,
      [startDate.toSQL()!, metricNames]
    )
    return result.rows
  }

  private async getSlowestPages(startDate: DateTime) {
    const result = await db.rawQuery(
      `SELECT
        page_path,
        AVG(CASE WHEN metric_name = 'LCP' THEN metric_value END) AS lcp,
        AVG(CASE WHEN metric_name = 'FCP' THEN metric_value END) AS fcp,
        AVG(CASE WHEN metric_name = 'CLS' THEN metric_value END) AS cls
      FROM analytics_performance
      WHERE timestamp >= ?
        AND metric_name IN ('LCP', 'FCP', 'CLS')
      GROUP BY page_path
      ORDER BY lcp DESC NULLS LAST
      LIMIT 5`,
      [startDate.toSQL()!]
    )
    return result.rows.map((row: any) => ({
      path: row.page_path,
      lcp: row.lcp ? Math.round(Number(row.lcp)) : 0,
      fcp: row.fcp ? Math.round(Number(row.fcp)) : 0,
      cls: row.cls ? Number(row.cls) : 0,
    }))
  }

  private async getDeviceBreakdown(startDate: DateTime) {
    return db
      .from('analytics_performance')
      .where('timestamp', '>=', startDate.toSQL()!)
      .select('device_type')
      .count('* as count')
      .groupBy('device_type')
      .orderBy('count', 'desc')
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
