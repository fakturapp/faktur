import type { HttpContext } from '@adonisjs/core/http'
import Quote from '#models/quote/quote'
import InvoiceSetting from '#models/team/invoice_setting'
import documentNumberingService from '#services/documents/document_numbering_service'

export default class NextNumber {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const settings = await InvoiceSetting.query().where('team_id', teamId).first()
    if (settings?.nextQuoteNumber) {
      return response.ok({
        nextNumber: documentNumberingService.normalizePattern(
          settings.nextQuoteNumber,
          'DEV-{annee}-{numero}'
        ),
      })
    }

    const currentYear = new Date().getFullYear().toString()
    const fallbackPattern = 'DEV-{annee}-{numero}'
    const prefix = documentNumberingService.buildSequencePrefix(
      settings?.quoteFilenamePattern,
      fallbackPattern,
      currentYear
    )

    const lastQuote = await Quote.query()
      .where('team_id', teamId)
      .where('quote_number', 'like', `${prefix}%`)
      .orderBy('created_at', 'desc')
      .first()

    const nextNumber = documentNumberingService.buildNextSequentialNumber({
      pattern: settings?.quoteFilenamePattern,
      fallbackPattern,
      currentYear,
      lastNumber: lastQuote?.quoteNumber,
    })

    return response.ok({ nextNumber })
  }
}
