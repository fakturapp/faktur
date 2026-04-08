import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Invoice from '#models/invoice/invoice'
import Quote from '#models/quote/quote'
import { DateTime } from 'luxon'
import { decryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'

export default class Stats {
  async handle(ctx: HttpContext) {
    const { auth, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      return response.ok({
        stats: {
          totalInvoiced: { value: 0, trend: 0, previousValue: 0 },
          outstanding: { value: 0, trend: 0 },
          totalCollected: { value: 0, trend: 0, previousValue: 0 },
          totalQuoted: { value: 0, trend: 0 },
          totalAccepted: { value: 0 },
        },
        recent: [],
        chartData: [],
      })
    }

    const now = DateTime.now()
    const startOfMonth = now.startOf('month').toISODate()!
    const startOfPrevMonth = now.minus({ months: 1 }).startOf('month').toISODate()!
    const endOfPrevMonth = now.startOf('month').minus({ days: 1 }).toISODate()!

    const [
      totalInvoicedCurrent,
      totalInvoicedPrev,
      outstandingResult,
      totalCollectedCurrent,
      totalCollectedPrev,
      totalQuotedCurrent,
      totalQuotedPrev,
      totalAcceptedCurrent,
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
        .whereIn('status', ['sent', 'overdue'])
        .sum('total as totalSum')
        .then((r) => Number(r[0].$extras.totalSum) || 0),

      Invoice.query()
        .where('team_id', teamId)
        .where('status', 'paid')
        .where((q) => {
          q.where((sub) => {
            sub.whereNotNull('paid_date').where('paid_date', '>=', startOfMonth)
          }).orWhere((sub) => {
            sub.whereNull('paid_date').where('issue_date', '>=', startOfMonth)
          })
        })
        .sum('total as totalSum')
        .then((r) => Number(r[0].$extras.totalSum) || 0),

      Invoice.query()
        .where('team_id', teamId)
        .where('status', 'paid')
        .where((q) => {
          q.where((sub) => {
            sub
              .whereNotNull('paid_date')
              .where('paid_date', '>=', startOfPrevMonth)
              .where('paid_date', '<=', endOfPrevMonth)
          }).orWhere((sub) => {
            sub
              .whereNull('paid_date')
              .where('issue_date', '>=', startOfPrevMonth)
              .where('issue_date', '<=', endOfPrevMonth)
          })
        })
        .sum('total as totalSum')
        .then((r) => Number(r[0].$extras.totalSum) || 0),

      Quote.query()
        .where('team_id', teamId)
        .whereNot('status', 'draft')
        .where('issue_date', '>=', startOfMonth)
        .sum('total as totalSum')
        .then((r) => Number(r[0].$extras.totalSum) || 0),

      Quote.query()
        .where('team_id', teamId)
        .whereNot('status', 'draft')
        .where('issue_date', '>=', startOfPrevMonth)
        .where('issue_date', '<=', endOfPrevMonth)
        .sum('total as totalSum')
        .then((r) => Number(r[0].$extras.totalSum) || 0),

      Quote.query()
        .where('team_id', teamId)
        .where('status', 'accepted')
        .where('issue_date', '>=', startOfMonth)
        .sum('total as totalSum')
        .then((r) => Number(r[0].$extras.totalSum) || 0),
    ])

    function calcTrend(current: number, previous: number) {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    const ninetyDaysAgo = now.minus({ days: 90 }).toISODate()!

    const [invoiceRows, quoteRows] = await Promise.all([
      db
        .from('invoices')
        .where('team_id', teamId)
        .whereNotIn('status', ['draft', 'cancelled'])
        .where('issue_date', '>=', ninetyDaysAgo)
        .select(db.raw('issue_date as day'))
        .sum('total as total')
        .groupBy('issue_date')
        .orderBy('issue_date'),

      db
        .from('quotes')
        .where('team_id', teamId)
        .whereNot('status', 'draft')
        .where('issue_date', '>=', ninetyDaysAgo)
        .select(db.raw('issue_date as day'))
        .sum('total as total')
        .groupBy('issue_date')
        .orderBy('issue_date'),
    ])

    function toDateStr(val: any): string {
      if (val instanceof Date) return val.toISOString().split('T')[0]
      return String(val)
    }

    const invoicesByDay: Record<string, number> = {}
    for (const row of invoiceRows) {
      invoicesByDay[toDateStr(row.day)] = Number(row.total) || 0
    }
    const quotesByDay: Record<string, number> = {}
    for (const row of quoteRows) {
      quotesByDay[toDateStr(row.day)] = Number(row.total) || 0
    }

    const chartData: { date: string; factures: number; devis: number }[] = []
    for (let i = 89; i >= 0; i--) {
      const d = now.minus({ days: i }).toISODate()!
      chartData.push({
        date: d,
        factures: invoicesByDay[d] || 0,
        devis: quotesByDay[d] || 0,
      })
    }

    const [recentInvoices, recentQuotes] = await Promise.all([
      Invoice.query()
        .where('team_id', teamId)
        .preload('client')
        .orderBy('created_at', 'desc')
        .limit(10),

      Quote.query()
        .where('team_id', teamId)
        .preload('client')
        .orderBy('created_at', 'desc')
        .limit(10),
    ])

    for (const inv of recentInvoices) {
      if (inv.client) {
        decryptModelFields(inv.client, [...ENCRYPTED_FIELDS.client], dek)
      }
    }
    for (const q of recentQuotes) {
      if (q.client) {
        decryptModelFields(q.client, [...ENCRYPTED_FIELDS.client], dek)
      }
    }

    const recent = [
      ...recentInvoices.map((inv) => ({
        id: inv.id,
        type: 'invoice' as const,
        number: inv.invoiceNumber,
        clientName: inv.client?.displayName || '',
        amount: inv.total,
        status: inv.status,
        date: inv.createdAt.toISO(),
      })),
      ...recentQuotes.map((q) => ({
        id: q.id,
        type: 'quote' as const,
        number: q.quoteNumber,
        clientName: q.client?.displayName || '',
        amount: q.total,
        status: q.status,
        date: q.createdAt.toISO(),
      })),
    ]
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 10)

    return response.ok({
      stats: {
        totalInvoiced: {
          value: totalInvoicedCurrent,
          trend: calcTrend(totalInvoicedCurrent, totalInvoicedPrev),
          previousValue: totalInvoicedPrev,
        },
        outstanding: {
          value: outstandingResult,
          trend: 0,
        },
        totalCollected: {
          value: totalCollectedCurrent,
          trend: calcTrend(totalCollectedCurrent, totalCollectedPrev),
          previousValue: totalCollectedPrev,
        },
        totalQuoted: {
          value: totalQuotedCurrent,
          trend: calcTrend(totalQuotedCurrent, totalQuotedPrev),
        },
        totalAccepted: {
          value: totalAcceptedCurrent,
        },
      },
      recent,
      chartData,
    })
  }
}
