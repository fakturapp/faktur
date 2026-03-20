import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Invoice from '#models/invoice/invoice'
import Expense from '#models/expense/expense'
import RecurringInvoice from '#models/recurring_invoice/recurring_invoice'

export default class CashFlow {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const months = Number(request.input('months', 6))
    const now = DateTime.now()

    // --- Past data: actual income/expenses per month ---
    const pastMonths = 3
    const pastStart = now.minus({ months: pastMonths }).startOf('month').toISODate()!

    // Paid invoices in the past period
    const paidInvoices = await Invoice.query()
      .where('team_id', teamId)
      .where('status', 'paid')
      .where((q) => {
        q.where((sub) => {
          sub.whereNotNull('paid_date').where('paid_date', '>=', pastStart)
        }).orWhere((sub) => {
          sub.whereNull('paid_date').where('issue_date', '>=', pastStart)
        })
      })

    // Expenses in the past period
    const pastExpenses = await Expense.query()
      .where('team_id', teamId)
      .where('expense_date', '>=', pastStart)

    // --- Future data: outstanding invoices (sent/overdue/partial) ---
    const outstandingInvoices = await Invoice.query()
      .where('team_id', teamId)
      .whereIn('status', ['sent', 'overdue', 'partial'])

    // Active recurring invoices
    const recurringInvoices = await RecurringInvoice.query()
      .where('team_id', teamId)
      .where('is_active', true)

    // Build monthly buckets
    const monthlyData: Array<{
      month: string
      income: number
      expenses: number
      net: number
      isPast: boolean
    }> = []

    for (let i = -pastMonths; i < months; i++) {
      const monthStart = now.plus({ months: i }).startOf('month')
      const monthEnd = monthStart.endOf('month')
      const monthKey = monthStart.toFormat('yyyy-MM')
      const isPast = i < 0

      let income = 0
      let expenseTotal = 0

      if (isPast) {
        // Actual data
        for (const inv of paidInvoices) {
          const invDate = inv.paidDate || inv.issueDate
          if (invDate >= monthStart.toISODate()! && invDate <= monthEnd.toISODate()!) {
            income += Number(inv.total) || 0
          }
        }
        for (const exp of pastExpenses) {
          if (exp.expenseDate >= monthStart.toISODate()! && exp.expenseDate <= monthEnd.toISODate()!) {
            expenseTotal += (Number(exp.amount) || 0) + (Number(exp.vatAmount) || 0)
          }
        }
      } else {
        // Forecast: outstanding invoices expected by due date
        for (const inv of outstandingInvoices) {
          const dueDate = inv.dueDate || inv.issueDate
          if (dueDate >= monthStart.toISODate()! && dueDate <= monthEnd.toISODate()!) {
            income += Number(inv.total) || 0
          }
        }

        // Forecast: recurring invoices
        for (const ri of recurringInvoices) {
          const nextExec = ri.nextExecutionDate
          if (nextExec >= monthStart.toISODate()! && nextExec <= monthEnd.toISODate()!) {
            // Estimate from recurring invoice subtotal + tax
            const riTotal = Number(ri.$extras?.total) || 0
            if (riTotal > 0) income += riTotal
          }
        }

        // Forecast expenses: use average of past months
        if (pastExpenses.length > 0) {
          const totalPastExpenses = pastExpenses.reduce(
            (sum, e) => sum + (Number(e.amount) || 0) + (Number(e.vatAmount) || 0),
            0
          )
          expenseTotal = totalPastExpenses / pastMonths
        }
      }

      monthlyData.push({
        month: monthKey,
        income: Math.round(income * 100) / 100,
        expenses: Math.round(expenseTotal * 100) / 100,
        net: Math.round((income - expenseTotal) * 100) / 100,
        isPast,
      })
    }

    // Running balance
    let runningBalance = 0
    const withBalance = monthlyData.map((m) => {
      runningBalance += m.net
      return { ...m, cumulativeNet: Math.round(runningBalance * 100) / 100 }
    })

    // Summary
    const futureMonths = withBalance.filter((m) => !m.isPast)
    const totalForecastIncome = futureMonths.reduce((s, m) => s + m.income, 0)
    const totalForecastExpenses = futureMonths.reduce((s, m) => s + m.expenses, 0)

    return response.ok({
      months: withBalance,
      summary: {
        forecastIncome: Math.round(totalForecastIncome * 100) / 100,
        forecastExpenses: Math.round(totalForecastExpenses * 100) / 100,
        forecastNet: Math.round((totalForecastIncome - totalForecastExpenses) * 100) / 100,
        outstandingCount: outstandingInvoices.length,
        outstandingTotal: Math.round(
          outstandingInvoices.reduce((s, i) => s + (Number(i.total) || 0), 0) * 100
        ) / 100,
        recurringCount: recurringInvoices.length,
      },
    })
  }
}
