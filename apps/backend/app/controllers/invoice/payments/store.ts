import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Invoice from '#models/invoice/invoice'
import InvoicePayment from '#models/invoice/invoice_payment'
import { encryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'

const storePaymentValidator = vine.compile(
  vine.object({
    amount: vine.number().positive(),
    paymentDate: vine.string().trim(),
    paymentMethod: vine.string().trim().optional(),
    notes: vine.string().trim().optional(),
  })
)

export default class Store {
  async handle(ctx: HttpContext) {
    const { auth, params, request, response } = ctx
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

    const payload = await request.validateUsing(storePaymentValidator)

    const paymentData: Record<string, any> = {
      invoiceId: params.invoiceId,
      teamId,
      amount: Math.round(payload.amount * 100) / 100,
      paymentDate: payload.paymentDate,
      paymentMethod: payload.paymentMethod || null,
      notes: payload.notes || null,
    }

    encryptModelFields(paymentData, [...ENCRYPTED_FIELDS.invoicePayment], dek)

    const payment = await InvoicePayment.create(paymentData)

    const allPayments = await InvoicePayment.query()
      .where('invoice_id', params.invoiceId)
      .where('team_id', teamId)

    const amountPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    const invoiceTotal = Number(invoice.total)

    if (amountPaid >= invoiceTotal) {
      invoice.status = 'paid'
      invoice.paidDate = payload.paymentDate
    } else if (amountPaid > 0) {
      invoice.status = 'partial'
    }

    await invoice.save()

    return response.created({
      message: 'Payment recorded',
      payment: { id: payment.id },
      invoiceStatus: invoice.status,
      amountPaid: Math.round(amountPaid * 100) / 100,
      amountDue: Math.round((invoiceTotal - amountPaid) * 100) / 100,
    })
  }
}
