import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Invoice from '#models/invoice/invoice'
import Quote from '#models/quote/quote'
import InvoiceTransformer from '#transformers/invoice_transformer'
import {
  decryptModelFields,
  decryptModelFieldsArray,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'

export default class Show {
  async handle(ctx: HttpContext) {
    const { auth, params, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const invoice = await Invoice.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .preload('client')
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!invoice) {
      return response.notFound({ message: 'Invoice not found' })
    }

    // Auto-transition sent → overdue when due date has passed
    if (invoice.status === 'sent' && invoice.dueDate) {
      const today = DateTime.now().toSQLDate()!
      if (invoice.dueDate < today) {
        invoice.status = 'overdue'
        await invoice.save()
      }
    }

    // Decrypt invoice fields
    decryptModelFields(invoice, [...ENCRYPTED_FIELDS.invoice], dek)

    // Decrypt lines
    decryptModelFieldsArray(invoice.lines, [...ENCRYPTED_FIELDS.invoiceLine], dek)

    // Decrypt client
    if (invoice.client) {
      decryptModelFields(invoice.client, [...ENCRYPTED_FIELDS.client], dek)
    }

    let sourceQuote: { id: string; quoteNumber: string } | null = null
    if (invoice.sourceQuoteId) {
      const quote = await Quote.find(invoice.sourceQuoteId)
      if (quote) {
        sourceQuote = { id: quote.id, quoteNumber: quote.quoteNumber }
      }
    }

    return response.ok({
      invoice: {
        ...(await ctx.serialize.withoutWrapping(InvoiceTransformer.transform(invoice))),
        sourceQuote,
      },
    })
  }
}
