import type { HttpContext } from '@adonisjs/core/http'
import Quote from '#models/quote/quote'

export default class NextNumber {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const lastQuote = await Quote.query()
      .where('team_id', teamId)
      .orderBy('created_at', 'desc')
      .first()

    let nextNumber = 'DEV-001'

    if (lastQuote) {
      const match = lastQuote.quoteNumber.match(/^DEV-(\d+)$/)
      if (match) {
        const num = parseInt(match[1], 10) + 1
        nextNumber = `DEV-${num.toString().padStart(3, '0')}`
      }
    }

    return response.ok({ nextNumber })
  }
}
