import type { HttpContext } from '@adonisjs/core/http'
import Quote from '#models/quote/quote'

export default class List {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const search = request.input('search', '')
    const status = request.input('status', '')

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

    const quotes = await query

    const quotesList = quotes.map((q) => ({
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

    return response.ok({ quotes: quotesList })
  }
}
