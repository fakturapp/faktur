import type { HttpContext } from '@adonisjs/core/http'
import Invoice from '#models/invoice/invoice'
import InvoicePayment from '#models/invoice/invoice_payment'

export default class Destroy {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const payment = await InvoicePayment.query()
      .where('id', params.id)
      .where('invoice_id', params.invoiceId)
      .where('team_id', teamId)
      .first()

    if (!payment) {
      return response.notFound({ message: 'Payment not found' })
    }

    await payment.delete()

    const invoice = await Invoice.query()
      .where('id', params.invoiceId)
      .where('team_id', teamId)
      .first()

    if (invoice) {
      const remainingPayments = await InvoicePayment.query()
        .where('invoice_id', params.invoiceId)
        .where('team_id', teamId)

      const amountPaid = remainingPayments.reduce((sum, p) => sum + Number(p.amount), 0)
      const invoiceTotal = Number(invoice.total)

      if (amountPaid >= invoiceTotal) {
        invoice.status = 'paid'
      } else if (amountPaid > 0) {
        invoice.status = 'partial'
      } else {
        invoice.status = 'sent'
        invoice.paidDate = null
      }

      await invoice.save()

      return response.ok({
        message: 'Payment deleted',
        invoiceStatus: invoice.status,
        amountPaid: Math.round(amountPaid * 100) / 100,
        amountDue: Math.round((invoiceTotal - amountPaid) * 100) / 100,
      })
    }

    return response.ok({ message: 'Payment deleted' })
  }
}
