import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Quote from '#models/quote/quote'
import Invoice from '#models/invoice/invoice'
import InvoiceLine from '#models/invoice/invoice_line'
import InvoiceSetting from '#models/team/invoice_setting'
import { encryptModelFields } from '#services/crypto/field_encryption_helper'

export default class ConvertQuote {
  async handle(ctx: HttpContext) {
    const { auth, params, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const quote = await Quote.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .preload('client')
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!quote) {
      return response.notFound({ message: 'Quote not found' })
    }

    const settings = await InvoiceSetting.query().where('team_id', teamId).first()
    let invoiceNumber: string

    if (settings?.nextInvoiceNumber) {
      invoiceNumber = settings.nextInvoiceNumber
      settings.nextInvoiceNumber = null
      await settings.save()
    } else {
      const lastInvoice = await Invoice.query()
        .where('team_id', teamId)
        .orderBy('created_at', 'desc')
        .first()

      invoiceNumber = 'FAC-001'
      if (lastInvoice) {
        const match = lastInvoice.invoiceNumber.match(/^FAC-(\d+)$/)
        if (match) {
          const num = Number.parseInt(match[1], 10) + 1
          invoiceNumber = `FAC-${num.toString().padStart(3, '0')}`
        }
      }
    }

    // Calculate due date: issue date + 30 days
    const today = new Date()
    const dueDate = new Date(today)
    dueDate.setDate(dueDate.getDate() + 30)
    const dueDateStr = dueDate.toISOString().slice(0, 10)
    const issueDateStr = today.toISOString().slice(0, 10)

    // Build invoice data — encrypted fields from quote are already encrypted,
    // but hardcoded plaintext fields (documentTitle, paymentTerms) need encryption.
    const invoiceData: Record<string, any> = {
      teamId,
      clientId: quote.clientId,
      invoiceNumber,
      status: 'draft',
      subject: quote.subject,
      issueDate: issueDateStr,
      dueDate: dueDateStr,
      billingType: quote.billingType,
      accentColor: quote.accentColor,
      logoUrl: quote.logoUrl,
      language: quote.language,
      notes: quote.notes,
      acceptanceConditions: quote.acceptanceConditions,
      signatureField: quote.signatureField,
      documentTitle: 'Facture',
      freeField: quote.freeField,
      globalDiscountType: quote.globalDiscountType,
      globalDiscountValue: quote.globalDiscountValue,
      deliveryAddress: quote.deliveryAddress,
      clientSiren: quote.clientSiren,
      clientVatNumber: quote.clientVatNumber,
      subtotal: quote.subtotal,
      taxAmount: quote.taxAmount,
      total: quote.total,
      sourceQuoteId: quote.id,
      paymentTerms: '30 jours net',
    }

    // Only encrypt the hardcoded plaintext fields — the rest are already encrypted from quote
    encryptModelFields(invoiceData, ['documentTitle', 'paymentTerms'], dek)

    const invoice = await db.transaction(async (trx) => {
      const inv = await Invoice.create(invoiceData, { client: trx })

      // Lines are already encrypted in the DB, copy as-is
      for (const line of quote.lines) {
        await InvoiceLine.create(
          {
            invoiceId: inv.id,
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

      return inv
    })

    return response.created({
      message: 'Invoice created from quote',
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      },
    })
  }
}
