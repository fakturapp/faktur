import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Quote from '#models/quote/quote'

export default class List {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    // Auto-transition sent → expired when validity date has passed
    await Quote.query()
      .where('teamId', teamId)
      .where('status', 'sent')
      .whereNotNull('validityDate')
      .where('validityDate', '<', DateTime.now().toSQLDate()!)
      .update({ status: 'expired' })

    const search = request.input('search', '')
    const status = request.input('status', '')
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)

    const query = Quote.query()
      .where('team_id', teamId)
      .preload('client')
      .orderBy('created_at', 'desc')

    if (status) {
      query.where('status', status)
    }

    if (search) {
      query.where((q) => {
        q.whereILike('quote_number', `%${search}%`)
          .orWhereILike('subject', `%${search}%`)
      })
    }

    const result = await query.paginate(page, perPage)

    const quotesList = result.all().map((q) => ({
      id: q.id,
      quoteNumber: q.quoteNumber,
      status: q.status,
      subject: q.subject,
      issueDate: q.issueDate,
      validityDate: q.validityDate,
      subtotal: q.subtotal,
      taxAmount: q.taxAmount,
      total: q.total,
      clientName: q.client?.displayName || null,
      clientId: q.clientId,
      createdAt: q.createdAt.toISO(),
    }))

    return response.ok({
      quotes: quotesList,
      meta: {
        total: result.total,
        perPage: result.perPage,
        currentPage: result.currentPage,
        lastPage: result.lastPage,
      },
    })
  }
}
