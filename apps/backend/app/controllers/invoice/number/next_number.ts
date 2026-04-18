import type { HttpContext } from '@adonisjs/core/http'
import Invoice from '#models/invoice/invoice'
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
    if (settings?.nextInvoiceNumber) {
      return response.ok({
        nextNumber: documentNumberingService.normalizePattern(
          settings.nextInvoiceNumber,
          'FAC-{annee}-{numero}'
        ),
      })
    }

    const currentYear = new Date().getFullYear().toString()
    const fallbackPattern = 'FAC-{annee}-{numero}'
    const prefix = documentNumberingService.buildSequencePrefix(
      settings?.invoiceNumberPattern || settings?.invoiceFilenamePattern,
      fallbackPattern,
      currentYear
    )

    const lastInvoice = await Invoice.query()
      .where('team_id', teamId)
      .where('invoice_number', 'like', `${prefix}%`)
      .orderBy('created_at', 'desc')
      .first()

    const nextNumber = documentNumberingService.buildNextSequentialNumber({
      pattern: settings?.invoiceNumberPattern || settings?.invoiceFilenamePattern,
      fallbackPattern,
      currentYear,
      lastNumber: lastInvoice?.invoiceNumber,
    })

    return response.ok({ nextNumber })
  }
}
