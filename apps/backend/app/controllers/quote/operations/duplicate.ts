import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Quote from '#models/quote/quote'
import QuoteLine from '#models/quote/quote_line'
import InvoiceSetting from '#models/team/invoice_setting'
import documentNumberingService from '#services/documents/document_numbering_service'

export default class Duplicate {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const source = await Quote.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!source) {
      return response.notFound({ message: 'Quote not found' })
    }

    const settings = await InvoiceSetting.query().where('team_id', teamId).first()
    let quoteNumber: string

    if (settings?.nextQuoteNumber) {
      quoteNumber = documentNumberingService.normalizePattern(
        settings.nextQuoteNumber,
        'DEV-{annee}-{numero}'
      )
      settings.nextQuoteNumber = null
      await settings.save()
    } else {
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

      quoteNumber = documentNumberingService.buildNextSequentialNumber({
        pattern: settings?.quoteFilenamePattern,
        fallbackPattern,
        currentYear,
        lastNumber: lastQuote?.quoteNumber,
      })
    }

    const today = new Date().toISOString().slice(0, 10)

    const quote = await db.transaction(async (trx) => {
      const q = await Quote.create(
        {
          teamId,
          clientId: source.clientId,
          quoteNumber,
          status: 'draft',
          subject: source.subject,
          issueDate: today,
          validityDate: source.validityDate,
          billingType: source.billingType,
          accentColor: source.accentColor,
          logoUrl: source.logoUrl,
          language: source.language,
          notes: source.notes,
          acceptanceConditions: source.acceptanceConditions,
          signatureField: source.signatureField,
          documentTitle: source.documentTitle,
          freeField: source.freeField,
          globalDiscountType: source.globalDiscountType,
          globalDiscountValue: source.globalDiscountValue,
          deliveryAddress: source.deliveryAddress,
          clientSiren: source.clientSiren,
          clientVatNumber: source.clientVatNumber,
          showQuantityColumn: source.showQuantityColumn,
          showUnitColumn: source.showUnitColumn,
          showUnitPriceColumn: source.showUnitPriceColumn,
          showVatColumn: source.showVatColumn,
          subtotal: source.subtotal,
          taxAmount: source.taxAmount,
          total: source.total,
        },
        { client: trx }
      )

      for (const line of source.lines) {
        await QuoteLine.create(
          {
            quoteId: q.id,
            position: line.position,
            description: line.description,
            saleType: line.saleType,
            quantity: line.quantity,
            unit: line.unit,
            unitPrice: line.unitPrice,
            vatRate: line.vatRate,
            total: line.total,
          },
          { client: trx }
        )
      }

      return q
    })

    return response.created({
      message: 'Quote duplicated',
      quote: { id: quote.id, quoteNumber: quote.quoteNumber },
    })
  }
}
