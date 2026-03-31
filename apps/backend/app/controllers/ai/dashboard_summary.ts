import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Invoice from '#models/invoice/invoice'
import Expense from '#models/expense/expense'
import AiService from '#services/ai/ai_service'
import { enforceQuota } from '#services/billing/quota_guard'
import quotaService from '#services/billing/quota_service'

export default class DashboardSummary {
  async handle(ctx: HttpContext) {
    const { auth, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    if (!(await AiService.isEnabled(teamId))) {
      return response.forbidden({ message: 'AI is not enabled.' })
    }

    const blocked = await enforceQuota(user.id, response)
    if (blocked) return blocked

    const now = DateTime.now()
    const startOfMonth = now.startOf('month').toISODate()!
    const startOfPrevMonth = now.minus({ months: 1 }).startOf('month').toISODate()!
    const endOfPrevMonth = now.startOf('month').minus({ days: 1 }).toISODate()!

    // Gather key metrics
    const [
      invoicedThisMonth,
      invoicedLastMonth,
      collectedThisMonth,
      collectedLastMonth,
      overdueCount,
      overdueTotal,
      expensesThisMonth,
    ] = await Promise.all([
      Invoice.query()
        .where('team_id', teamId)
        .whereNotIn('status', ['draft', 'cancelled'])
        .where('issue_date', '>=', startOfMonth)
        .sum('total as totalSum')
        .then((r) => Number(r[0].$extras.totalSum) || 0),
      Invoice.query()
        .where('team_id', teamId)
        .whereNotIn('status', ['draft', 'cancelled'])
        .where('issue_date', '>=', startOfPrevMonth)
        .where('issue_date', '<=', endOfPrevMonth)
        .sum('total as totalSum')
        .then((r) => Number(r[0].$extras.totalSum) || 0),
      Invoice.query()
        .where('team_id', teamId)
        .where('status', 'paid')
        .whereNotNull('paid_date')
        .where('paid_date', '>=', startOfMonth)
        .sum('total as totalSum')
        .then((r) => Number(r[0].$extras.totalSum) || 0),
      Invoice.query()
        .where('team_id', teamId)
        .where('status', 'paid')
        .whereNotNull('paid_date')
        .where('paid_date', '>=', startOfPrevMonth)
        .where('paid_date', '<=', endOfPrevMonth)
        .sum('total as totalSum')
        .then((r) => Number(r[0].$extras.totalSum) || 0),
      Invoice.query()
        .where('team_id', teamId)
        .whereIn('status', ['overdue'])
        .count('* as cnt')
        .then((r) => Number(r[0].$extras.cnt) || 0),
      Invoice.query()
        .where('team_id', teamId)
        .whereIn('status', ['overdue'])
        .sum('total as totalSum')
        .then((r) => Number(r[0].$extras.totalSum) || 0),
      Expense.query()
        .where('team_id', teamId)
        .where('expense_date', '>=', startOfMonth)
        .sum('amount as amountSum')
        .then((r) => Number(r[0].$extras.amountSum) || 0),
    ])

    const systemPrompt = `Tu es un assistant financier pour un logiciel de facturation français. On te donne les métriques du mois en cours. Génère un résumé en 2-3 phrases naturelles, concises et utiles. Utilise le tutoiement. Formate les montants en euros (ex: 1 250 €). Si des factures sont en retard, mentionne-le. Compare avec le mois précédent si pertinent. Réponds UNIQUEMENT avec le résumé, sans guillemets.`

    const metricsText = `
Mois en cours: ${now.toFormat('MMMM yyyy', { locale: 'fr' })}
Facturé ce mois: ${invoicedThisMonth.toFixed(2)}€
Facturé le mois dernier: ${invoicedLastMonth.toFixed(2)}€
Encaissé ce mois: ${collectedThisMonth.toFixed(2)}€
Encaissé le mois dernier: ${collectedLastMonth.toFixed(2)}€
Factures en retard: ${overdueCount} pour ${overdueTotal.toFixed(2)}€
Dépenses ce mois: ${expensesThisMonth.toFixed(2)}€`

    try {
      const summary = await AiService.generate(teamId, dek, systemPrompt, metricsText, 256)
      await quotaService.recordUsage(user.id, teamId, 'dashboard_summary', 'ai', 'default')
      return response.ok({ summary: summary.trim() })
    } catch (error: any) {
      return response.internalServerError({ message: 'AI summary failed', error: error.message })
    }
  }
}
