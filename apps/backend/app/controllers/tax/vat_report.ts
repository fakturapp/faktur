import type { HttpContext } from '@adonisjs/core/http'
import Invoice from '#models/invoice/invoice'
import Expense from '#models/expense/expense'
import CreditNote from '#models/credit_note/credit_note'

export default class VatReport {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const startDate = request.input('startDate')
    const endDate = request.input('endDate')

    if (!startDate || !endDate) {
      return response.badRequest({ message: 'startDate and endDate are required' })
    }

    const invoices = await Invoice.query()
      .where('team_id', teamId)
      .whereNotIn('status', ['draft', 'cancelled'])
      .where('issue_date', '>=', startDate)
      .where('issue_date', '<=', endDate)

    const creditNotes = await CreditNote.query()
      .where('team_id', teamId)
      .whereNotIn('status', ['draft', 'cancelled'])
      .where('issue_date', '>=', startDate)
      .where('issue_date', '<=', endDate)

    const expenses = await Expense.query()
      .where('team_id', teamId)
      .where('is_deductible', true)
      .where('expense_date', '>=', startDate)
      .where('expense_date', '<=', endDate)

    const vatCollectedByRate: Record<string, { base: number; vat: number }> = {}
    let totalBaseCollected = 0
    let totalVatCollected = 0

    for (const inv of invoices) {
      const base = Number(inv.subtotal) || 0
      const vat = Number(inv.taxAmount) || 0
      totalBaseCollected += base
      totalVatCollected += vat

      const effectiveRate = base > 0 ? Math.round((vat / base) * 10000) / 100 : 0
      const rateKey = effectiveRate.toFixed(1)
      if (!vatCollectedByRate[rateKey]) vatCollectedByRate[rateKey] = { base: 0, vat: 0 }
      vatCollectedByRate[rateKey].base += base
      vatCollectedByRate[rateKey].vat += vat
    }

    let totalCreditNoteBase = 0
    let totalCreditNoteVat = 0

    for (const cn of creditNotes) {
      const base = Number(cn.subtotal) || 0
      const vat = Number(cn.taxAmount) || 0
      totalCreditNoteBase += base
      totalCreditNoteVat += vat
    }

    const vatDeductibleByRate: Record<string, { base: number; vat: number }> = {}
    let totalBaseDeductible = 0
    let totalVatDeductible = 0

    for (const exp of expenses) {
      const amount = Number(exp.amount) || 0
      const vat = Number(exp.vatAmount) || 0
      totalBaseDeductible += amount
      totalVatDeductible += vat

      const rate = Number(exp.vatRate) || 0
      const rateKey = rate.toFixed(1)
      if (!vatDeductibleByRate[rateKey]) vatDeductibleByRate[rateKey] = { base: 0, vat: 0 }
      vatDeductibleByRate[rateKey].base += amount
      vatDeductibleByRate[rateKey].vat += vat
    }

    const netVatCollected = totalVatCollected - totalCreditNoteVat

    const vatBalance = netVatCollected - totalVatDeductible

    const round2 = (n: number) => Math.round(n * 100) / 100

    return response.ok({
      period: { startDate, endDate },
      collected: {
        totalBase: round2(totalBaseCollected),
        totalVat: round2(totalVatCollected),
        byRate: Object.entries(vatCollectedByRate)
          .map(([rate, v]) => ({
            rate: Number.parseFloat(rate),
            base: round2(v.base),
            vat: round2(v.vat),
          }))
          .sort((a, b) => a.rate - b.rate),
        invoiceCount: invoices.length,
      },
      creditNotes: {
        totalBase: round2(totalCreditNoteBase),
        totalVat: round2(totalCreditNoteVat),
        count: creditNotes.length,
      },
      deductible: {
        totalBase: round2(totalBaseDeductible),
        totalVat: round2(totalVatDeductible),
        byRate: Object.entries(vatDeductibleByRate)
          .map(([rate, v]) => ({
            rate: Number.parseFloat(rate),
            base: round2(v.base),
            vat: round2(v.vat),
          }))
          .sort((a, b) => a.rate - b.rate),
        expenseCount: expenses.length,
      },
      summary: {
        netVatCollected: round2(netVatCollected),
        totalVatDeductible: round2(totalVatDeductible),
        vatBalance: round2(vatBalance),
        status: vatBalance > 0 ? 'owed' : vatBalance < 0 ? 'credit' : 'zero',
      },
    })
  }
}
