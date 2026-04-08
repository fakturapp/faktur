import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Quote from '#models/quote/quote'
import QuoteLine from '#models/quote/quote_line'
import InvoiceSetting from '#models/team/invoice_setting'
import { createQuoteValidator } from '#validators/quote_validator'
import { encryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'

export default class Create {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const payload = await request.validateUsing(createQuoteValidator)

    const settings = await InvoiceSetting.query().where('team_id', teamId).first()
    let quoteNumber: string

    if (settings?.nextQuoteNumber) {
      quoteNumber = settings.nextQuoteNumber
      settings.nextQuoteNumber = null
      await settings.save()
    } else {
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

      quoteNumber = `${prefix}${nextNum.toString().padStart(3, '0')}`
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

    const quoteData: Record<string, any> = {
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
      vatExemptReason: payload.vatExemptReason || 'none',
      clientSnapshot: payload.clientSnapshot ? JSON.stringify(payload.clientSnapshot) : null,
      companySnapshot: payload.companySnapshot ? JSON.stringify(payload.companySnapshot) : null,
    }

    encryptModelFields(quoteData, [...ENCRYPTED_FIELDS.quote], dek)

    const quote = await db.transaction(async (trx) => {
      const q = await Quote.create(quoteData, { client: trx })

      for (const lineData of linesData) {
        const lineRecord: Record<string, any> = {
          quoteId: q.id,
          ...lineData,
          total: Math.round(lineData.total * 100) / 100,
        }
        encryptModelFields(lineRecord, [...ENCRYPTED_FIELDS.quoteLine], dek)
        await QuoteLine.create(lineRecord, { client: trx })
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
