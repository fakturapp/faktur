import type { HttpContext } from '@adonisjs/core/http'
import Quote from '#models/quote/quote'
import InvoiceSetting from '#models/team/invoice_setting'

export default class NextNumber {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    // Check if there's a custom starting number set
    const settings = await InvoiceSetting.query().where('team_id', teamId).first()
    if (settings?.nextQuoteNumber) {
      return response.ok({ nextNumber: settings.nextQuoteNumber })
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
