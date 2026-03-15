import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Invoice from '#models/invoice/invoice'

export default class List {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    // Auto-transition sent → overdue when due date has passed
    await Invoice.query()
      .where('teamId', teamId)
      .where('status', 'sent')
      .whereNotNull('dueDate')
      .where('dueDate', '<', DateTime.now().toSQLDate()!)
      .update({ status: 'overdue' })

    const search = request.input('search', '')
    const status = request.input('status', '')
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)

    const query = Invoice.query()
      .where('team_id', teamId)
      .preload('client')
      .orderBy('created_at', 'desc')

    if (status) {
      query.where('status', status)
    }

    if (search) {
      query.where((q) => {
        q.whereILike('invoice_number', `%${search}%`)
          .orWhereILike('subject', `%${search}%`)
      })
    }

    const result = await query.paginate(page, perPage)

    const invoicesList = result.all().map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      subject: inv.subject,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      subtotal: inv.subtotal,
      taxAmount: inv.taxAmount,
      total: inv.total,
      clientName: inv.client?.displayName || null,
      clientId: inv.clientId,
      sourceQuoteId: inv.sourceQuoteId,
      createdAt: inv.createdAt.toISO(),
    }))

    return response.ok({
      invoices: invoicesList,
      meta: {
        total: result.total,
        perPage: result.perPage,
        currentPage: result.currentPage,
        lastPage: result.lastPage,
      },
    })
  }
}
