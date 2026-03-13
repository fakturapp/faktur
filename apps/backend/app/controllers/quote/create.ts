import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Quote from '#models/quote/quote'
import QuoteLine from '#models/quote/quote_line'
import { createQuoteValidator } from '#validators/quote_validator'

export default class Create {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const payload = await request.validateUsing(createQuoteValidator)

    // Generate next quote number
    const lastQuote = await Quote.query()
      .where('team_id', teamId)
      .orderBy('created_at', 'desc')
      .first()

    let quoteNumber = 'DEV-001'
    if (lastQuote) {
      const match = lastQuote.quoteNumber.match(/^DEV-(\d+)$/)
      if (match) {
        const num = parseInt(match[1], 10) + 1
        quoteNumber = `DEV-${num.toString().padStart(3, '0')}`
      }
    }

    // Calculate totals from lines
    let subtotal = 0
    let taxAmount = 0
    const linesData = payload.lines.map((line, index) => {
      const lineTotal = line.quantity * line.unitPrice
      const lineTax = lineTotal * (line.vatRate / 100)
      subtotal += lineTotal
      taxAmount += lineTax
      return {
        position: index,
        description: line.description,
        saleType: line.saleType || null,
        quantity: line.quantity,
        unit: line.unit || null,
        unitPrice: line.unitPrice,
        vatRate: line.vatRate,
        total: lineTotal,
      }
    })

    // Apply global discount
    let discountAmount = 0
    const discountType = payload.globalDiscountType || 'none'
    const discountValue = payload.globalDiscountValue || 0
    if (discountType === 'percentage' && discountValue > 0) {
      discountAmount = subtotal * (discountValue / 100)
    } else if (discountType === 'fixed' && discountValue > 0) {
      discountAmount = discountValue
    }

    const total = subtotal + taxAmount - discountAmount

    const quote = await db.transaction(async (trx) => {
      const q = await Quote.create(
        {
          teamId,
          clientId: payload.clientId || null,
          quoteNumber,
          status: 'draft',
          subject: payload.subject || null,
          issueDate: payload.issueDate,
          validityDate: payload.validityDate || null,
          billingType: payload.billingType,
          accentColor: payload.accentColor,
          logoUrl: payload.logoUrl || null,
          language: payload.language || 'fr',
          notes: payload.notes || null,
          acceptanceConditions: payload.acceptanceConditions || null,
          signatureField: payload.signatureField ?? false,
          documentTitle: payload.documentTitle || null,
          freeField: payload.freeField || null,
          globalDiscountType: discountType,
          globalDiscountValue: discountValue,
          deliveryAddress: payload.deliveryAddress || null,
          clientSiren: payload.clientSiren || null,
          clientVatNumber: payload.clientVatNumber || null,
          subtotal: Math.round(subtotal * 100) / 100,
          taxAmount: Math.round(taxAmount * 100) / 100,
          total: Math.round(total * 100) / 100,
        },
        { client: trx }
      )

      for (const lineData of linesData) {
        await QuoteLine.create(
          {
            quoteId: q.id,
            ...lineData,
            total: Math.round(lineData.total * 100) / 100,
          },
          { client: trx }
        )
      }

      return q
    })

    return response.created({
      message: 'Quote created',
      quote: {
        id: quote.id,
        quoteNumber: quote.quoteNumber,
        status: quote.status,
        total: quote.total,
      },
    })
  }
}
