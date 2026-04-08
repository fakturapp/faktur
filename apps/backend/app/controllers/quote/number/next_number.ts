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

    const settings = await InvoiceSetting.query().where('team_id', teamId).first()
    if (settings?.nextQuoteNumber) {
      return response.ok({ nextNumber: settings.nextQuoteNumber })
    }

    const pattern = settings?.quoteFilenamePattern || 'DEV-{annee}-{numero}'
    const currentYear = new Date().getFullYear().toString()
    const prefix = pattern.replace('{annee}', currentYear).replace('{numero}', '')

    const lastQuote = await Quote.query()
      .where('team_id', teamId)
      .where('quote_number', 'like', `${prefix}%`)
      .orderBy('created_at', 'desc')
      .first()

    let nextNum = 1
    if (lastQuote) {
      const numStr = lastQuote.quoteNumber.slice(prefix.length)
      const parsed = Number.parseInt(numStr, 10)
      if (!Number.isNaN(parsed)) nextNum = parsed + 1
    }

    const nextNumber = `${prefix}${nextNum.toString().padStart(3, '0')}`

    return response.ok({ nextNumber })
  }
}
