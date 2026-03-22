import type { HttpContext } from '@adonisjs/core/http'
import InvoicePayment from '#models/invoice/invoice_payment'
import Invoice from '#models/invoice/invoice'
import InvoicePaymentTransformer from '#transformers/invoice_payment_transformer'
import { decryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'

export default class Index {
  async handle(ctx: HttpContext) {
    const { auth, params, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const invoice = await Invoice.query()
      .where('id', params.invoiceId)
      .where('team_id', teamId)
      .first()

    if (!invoice) {
      return response.notFound({ message: 'Invoice not found' })
    }

    const payments = await InvoicePayment.query()
      .where('invoice_id', params.invoiceId)
      .where('team_id', teamId)
      .orderBy('payment_date', 'asc')

    for (const payment of payments) {
      decryptModelFields(payment, [...ENCRYPTED_FIELDS.invoicePayment], dek)
    }

    const amountPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const amountDue = Number(invoice.total) - amountPaid

    return response.ok({
      payments: await ctx.serialize.withoutWrapping(InvoicePaymentTransformer.transform(payments)),
      summary: {
        total: Number(invoice.total),
        amountPaid: Math.round(amountPaid * 100) / 100,
        amountDue: Math.round(amountDue * 100) / 100,
        paymentCount: payments.length,
      },
    })
  }
}
