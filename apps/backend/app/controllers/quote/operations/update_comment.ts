import type { HttpContext } from '@adonisjs/core/http'
import Quote from '#models/quote/quote'

export default class UpdateComment {
  async handle({ auth, params, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const quote = await Quote.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .first()

    if (!quote) {
      return response.notFound({ message: 'Quote not found' })
    }

    const { comment } = request.only(['comment'])
    quote.comment = comment || null
    await quote.save()

    return response.ok({ message: 'Comment updated' })
  }
}
