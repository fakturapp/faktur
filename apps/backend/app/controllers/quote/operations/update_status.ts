import type { HttpContext } from '@adonisjs/core/http'
import Quote from '#models/quote/quote'

export default class UpdateStatus {
  async handle({ auth, params, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const { status } = request.only(['status'])
    const validStatuses = ['draft', 'sent', 'accepted', 'refused', 'expired']

    if (!validStatuses.includes(status)) {
      return response.badRequest({ message: 'Invalid status' })
    }

    const quote = await Quote.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .first()

    if (!quote) {
      return response.notFound({ message: 'Quote not found' })
    }

    quote.status = status
    await quote.save()

    return response.ok({ quote: { id: quote.id, status: quote.status } })
  }
}
