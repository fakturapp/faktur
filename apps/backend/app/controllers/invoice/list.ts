import type { HttpContext } from '@adonisjs/core/http'
import Invoice from '#models/invoice/invoice'

export default class List {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const search = request.input('search', '')
    const status = request.input('status', '')

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

    const invoices = await query

    const invoicesList = invoices.map((inv) => ({
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

    return response.ok({ invoices: invoicesList })
  }
}
