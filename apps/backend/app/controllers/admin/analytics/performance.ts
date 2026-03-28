import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

const METRIC_THRESHOLDS: Record<string, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
}

export default class AnalyticsPerformance {
  async handle({ request, response }: HttpContext) {
    const period = request.input('period', '7d')
    const startDate = this.getStartDate(period)
    const metricNames = ['LCP', 'FID', 'CLS', 'INP', 'FCP', 'TTFB']

    const [p75Results, distributionResults, byPage, byDevice] = await Promise.all([
      this.getP75(startDate, metricNames),
      this.getDistribution(startDate, metricNames),
      this.getByPage(startDate),
      this.getByDevice(startDate),
    ])

    const metrics: Record<
      string,
      { p75: number | null; distribution: { good: number; needsImprovement: number; poor: number } }
    > = {}

    for (const name of metricNames) {
      const p75Row = p75Results.find((r: any) => r.metric_name === name)
      const distRow = distributionResults.filter((r: any) => r.metric_name === name)

      const distribution = { good: 0, needsImprovement: 0, poor: 0 }
      for (const d of distRow) {
        if (d.rating === 'good') distribution.good = Number(d.count)
        else if (d.rating === 'needs-improvement') distribution.needsImprovement = Number(d.count)
        else if (d.rating === 'poor') distribution.poor = Number(d.count)
      }

      metrics[name] = {
        p75: p75Row ? Number(p75Row.p75) : null,
        distribution,
      }
    }

    return response.ok({ metrics, byPage, byDevice })
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

  private async getByPage(startDate: DateTime) {
    const rows = await db
      .from('analytics_performance')
      .where('timestamp', '>=', startDate.toSQL()!)
      .where('metric_name', 'LCP')
      .select('page_path')
      .avg('metric_value as avg_lcp')
      .count('* as count')
      .groupBy('page_path')
      .orderBy('avg_lcp', 'desc')
      .limit(5)

    return rows.map((row) => ({
      pagePath: row.page_path,
      avgLcp: Math.round(Number(row.avg_lcp)),
      count: Number(row.count),
    }))
  }

  private async getByDevice(startDate: DateTime) {
    const rows = await db
      .from('analytics_performance')
      .where('timestamp', '>=', startDate.toSQL()!)
      .select('device_type')
      .avg('metric_value as avg_value')
      .count('* as count')
      .groupBy('device_type')

    return rows.map((row) => ({
      deviceType: row.device_type || 'unknown',
      avgValue: Math.round(Number(row.avg_value)),
      count: Number(row.count),
    }))
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
