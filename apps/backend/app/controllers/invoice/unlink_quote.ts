import type { HttpContext } from '@adonisjs/core/http'
import Invoice from '#models/invoice/invoice'

export default class UnlinkQuote {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const invoice = await Invoice.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .first()

    if (!invoice) {
      return response.notFound({ message: 'Invoice not found' })
    }

    invoice.sourceQuoteId = null
    await invoice.save()

    return response.ok({ message: 'Quote unlinked' })
  }
}
