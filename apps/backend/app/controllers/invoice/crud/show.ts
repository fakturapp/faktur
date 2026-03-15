import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Invoice from '#models/invoice/invoice'
import Quote from '#models/quote/quote'

export default class Show {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

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

    let sourceQuote: { id: string; quoteNumber: string } | null = null
    if (invoice.sourceQuoteId) {
      const quote = await Quote.find(invoice.sourceQuoteId)
      if (quote) {
        sourceQuote = { id: quote.id, quoteNumber: quote.quoteNumber }
      }
    }

    return response.ok({
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        subject: invoice.subject,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        billingType: invoice.billingType,
        accentColor: invoice.accentColor,
        logoUrl: invoice.logoUrl,
        language: invoice.language,
        notes: invoice.notes,
        acceptanceConditions: invoice.acceptanceConditions,
        signatureField: invoice.signatureField,
        documentTitle: invoice.documentTitle,
        freeField: invoice.freeField,
        globalDiscountType: invoice.globalDiscountType,
        globalDiscountValue: invoice.globalDiscountValue,
        deliveryAddress: invoice.deliveryAddress,
        clientSiren: invoice.clientSiren,
        clientVatNumber: invoice.clientVatNumber,
        subtotal: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        sourceQuoteId: invoice.sourceQuoteId,
        sourceQuote,
        comment: invoice.comment,
        paymentTerms: invoice.paymentTerms,
        paidDate: invoice.paidDate,
        clientId: invoice.clientId,
        client: invoice.client
          ? {
              id: invoice.client.id,
              type: invoice.client.type,
              displayName: invoice.client.displayName,
              companyName: invoice.client.companyName,
              firstName: invoice.client.firstName,
              lastName: invoice.client.lastName,
              email: invoice.client.email,
              phone: invoice.client.phone,
              address: invoice.client.address,
              addressComplement: invoice.client.addressComplement,
              postalCode: invoice.client.postalCode,
              city: invoice.client.city,
              country: invoice.client.country,
              siren: invoice.client.siren,
              vatNumber: invoice.client.vatNumber,
            }
          : null,
        lines: invoice.lines.map((l) => ({
          id: l.id,
          position: l.position,
          description: l.description,
          saleType: l.saleType,
          quantity: l.quantity,
          unit: l.unit,
          unitPrice: l.unitPrice,
          vatRate: l.vatRate,
          total: l.total,
        })),
        createdAt: invoice.createdAt.toISO(),
      },
    })
  }
}
