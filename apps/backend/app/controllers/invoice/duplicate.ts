import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Invoice from '#models/invoice/invoice'
import InvoiceLine from '#models/invoice/invoice_line'
import InvoiceSetting from '#models/team/invoice_setting'

export default class Duplicate {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const source = await Invoice.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!source) {
      return response.notFound({ message: 'Invoice not found' })
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
          const num = parseInt(match[1], 10) + 1
          invoiceNumber = `FAC-${num.toString().padStart(3, '0')}`
        }
      }
    }

    const today = new Date().toISOString().slice(0, 10)

    const invoice = await db.transaction(async (trx) => {
      const inv = await Invoice.create(
        {
          teamId,
          clientId: source.clientId,
          invoiceNumber,
          status: 'draft',
          subject: source.subject,
          issueDate: today,
          dueDate: source.dueDate,
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
          subtotal: source.subtotal,
          taxAmount: source.taxAmount,
          total: source.total,
          paymentTerms: source.paymentTerms,
        },
        { client: trx }
      )

      for (const line of source.lines) {
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
      message: 'Invoice duplicated',
      invoice: { id: invoice.id, invoiceNumber: invoice.invoiceNumber },
    })
  }
}
