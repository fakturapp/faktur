import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

/**
 * Available chart types that users can display on their dashboard.
 */
const AVAILABLE_CHARTS = [
  { key: 'revenue', label: 'CA HT (facturé)', description: 'Chiffre d\'affaires hors taxes facturé par mois' },
  { key: 'collected', label: 'CA encaissé', description: 'Chiffre d\'affaires encaissé par mois' },
  { key: 'micro', label: 'Seuils micro-entrepreneur', description: 'CA cumulé vs seuils micro-entrepreneur' },
]

/**
 * Micro-entrepreneur thresholds (standard French thresholds).
 */
const MICRO_THRESHOLDS = {
  services: 77700,
  goods: 188700,
}

export default class Charts {
  /**
   * GET /dashboard/charts
   * Returns available chart types.
   */
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    return response.ok({
      availableCharts: AVAILABLE_CHARTS,
      activeCharts: ['revenue', 'collected', 'micro'],
      teamId: teamId || null,
    })
  }

  /**
   * GET /dashboard/charts/revenue
   * CA HT over time - invoiced revenue by month (last 12 months).
   * Excludes draft and cancelled invoices. Uses subtotal (HT = hors taxes).
   */
  async revenue({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.ok({ data: [], period: '12m' })
    }

    const now = DateTime.now()
    const twelveMonthsAgo = now.minus({ months: 11 }).startOf('month').toISODate()!

    const rows = await db
      .from('invoices')
      .where('team_id', teamId)
      .whereNotIn('status', ['draft', 'cancelled'])
      .where('issue_date', '>=', twelveMonthsAgo)
      .select(db.raw("to_char(issue_date::date, 'YYYY-MM') as month"))
      .sum('subtotal as subtotal')
      .sum('total as total')
      .count('* as count')
      .groupByRaw("to_char(issue_date::date, 'YYYY-MM')")
      .orderByRaw("to_char(issue_date::date, 'YYYY-MM') asc")

    // Build a full 12-month series with zeros for missing months
    const rowsByMonth: Record<string, { subtotal: number; total: number; count: number }> = {}
    for (const row of rows) {
      rowsByMonth[row.month] = {
        subtotal: Number(row.subtotal) || 0,
        total: Number(row.total) || 0,
        count: Number(row.count) || 0,
      }
    }

    const data: { month: string; label: string; subtotal: number; total: number; count: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const dt = now.minus({ months: i }).startOf('month')
      const monthKey = dt.toFormat('yyyy-MM')
      const label = dt.setLocale('fr').toFormat('MMM yyyy')
      const entry = rowsByMonth[monthKey]

      data.push({
        month: monthKey,
        label,
        subtotal: entry?.subtotal ?? 0,
        total: entry?.total ?? 0,
        count: entry?.count ?? 0,
      })
    }

    return response.ok({ data, period: '12m' })
  }

  /**
   * GET /dashboard/charts/collected
   * CA encaisse over time - paid invoices by month (last 12 months).
   * Uses paid_date when available, falls back to issue_date.
   */
  async collected({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.ok({ data: [], period: '12m' })
    }

    const now = DateTime.now()
    const twelveMonthsAgo = now.minus({ months: 11 }).startOf('month').toISODate()!

    // Use COALESCE to prefer paid_date, fall back to issue_date
    const rows = await db
      .from('invoices')
      .where('team_id', teamId)
      .where('status', 'paid')
      .whereRaw("COALESCE(paid_date, issue_date) >= ?", [twelveMonthsAgo])
      .select(db.raw("to_char(COALESCE(paid_date, issue_date)::date, 'YYYY-MM') as month"))
      .sum('subtotal as subtotal')
      .sum('total as total')
      .count('* as count')
      .groupByRaw("to_char(COALESCE(paid_date, issue_date)::date, 'YYYY-MM')")
      .orderByRaw("to_char(COALESCE(paid_date, issue_date)::date, 'YYYY-MM') asc")

    // Build a full 12-month series
    const rowsByMonth: Record<string, { subtotal: number; total: number; count: number }> = {}
    for (const row of rows) {
      rowsByMonth[row.month] = {
        subtotal: Number(row.subtotal) || 0,
        total: Number(row.total) || 0,
        count: Number(row.count) || 0,
      }
    }

    const data: { month: string; label: string; subtotal: number; total: number; count: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const dt = now.minus({ months: i }).startOf('month')
      const monthKey = dt.toFormat('yyyy-MM')
      const label = dt.setLocale('fr').toFormat('MMM yyyy')
      const entry = rowsByMonth[monthKey]

      data.push({
        month: monthKey,
        label,
        subtotal: entry?.subtotal ?? 0,
        total: entry?.total ?? 0,
        count: entry?.count ?? 0,
      })
    }

    return response.ok({ data, period: '12m' })
  }

  /**
   * GET /dashboard/charts/micro-thresholds
   * Cumulative CA (HT) for the current fiscal year vs micro-entrepreneur thresholds.
   * Returns monthly cumulative subtotals for the current calendar year.
   */
  async micro({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.ok({
        data: [],
        thresholds: MICRO_THRESHOLDS,
        year: DateTime.now().year,
      })
    }

    const now = DateTime.now()
    const currentYear = now.year
    const startOfYear = `${currentYear}-01-01`

    // Get monthly subtotals for current year (invoices not draft/cancelled)
    const rows = await db
      .from('invoices')
      .where('team_id', teamId)
      .whereNotIn('status', ['draft', 'cancelled'])
      .where('issue_date', '>=', startOfYear)
      .whereRaw("to_char(issue_date::date, 'YYYY') = ?", [String(currentYear)])
      .select(db.raw("to_char(issue_date::date, 'YYYY-MM') as month"))
      .sum('subtotal as subtotal')
      .count('* as count')
      .groupByRaw("to_char(issue_date::date, 'YYYY-MM')")
      .orderByRaw("to_char(issue_date::date, 'YYYY-MM') asc")

    const rowsByMonth: Record<string, { subtotal: number; count: number }> = {}
    for (const row of rows) {
      rowsByMonth[row.month] = {
        subtotal: Number(row.subtotal) || 0,
        count: Number(row.count) || 0,
      }
    }

    // Build cumulative data for each month up to the current month
    const currentMonth = now.month
    let cumulative = 0

    const data: {
      month: string
      label: string
      subtotal: number
      cumulative: number
      count: number
      thresholdServices: number
      thresholdGoods: number
    }[] = []

    for (let m = 1; m <= currentMonth; m++) {
      const monthKey = `${currentYear}-${String(m).padStart(2, '0')}`
      const dt = DateTime.fromObject({ year: currentYear, month: m })
      const label = dt.setLocale('fr').toFormat('MMM yyyy')
      const entry = rowsByMonth[monthKey]
      const monthSubtotal = entry?.subtotal ?? 0

      cumulative += monthSubtotal

      data.push({
        month: monthKey,
        label,
        subtotal: monthSubtotal,
        cumulative,
        count: entry?.count ?? 0,
        thresholdServices: MICRO_THRESHOLDS.services,
        thresholdGoods: MICRO_THRESHOLDS.goods,
      })
    }

    return response.ok({
      data,
      thresholds: MICRO_THRESHOLDS,
      year: currentYear,
    })
  }
}
