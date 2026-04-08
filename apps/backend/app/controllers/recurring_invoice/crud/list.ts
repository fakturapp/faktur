import type { HttpContext } from '@adonisjs/core/http'
import RecurringInvoice from '#models/recurring_invoice/recurring_invoice'
import RecurringInvoiceTransformer from '#transformers/recurring_invoice_transformer'
import {
  decryptModelFields,
  decryptModelFieldsArray,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'

export default class List {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const active = request.input('active', '')

    const query = RecurringInvoice.query()
      .where('team_id', teamId)
      .preload('client')
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .orderBy('created_at', 'desc')

    if (active === 'true') {
      query.where('is_active', true)
    } else if (active === 'false') {
      query.where('is_active', false)
    }

    const recurringInvoices = await query

    decryptModelFieldsArray(recurringInvoices, [...ENCRYPTED_FIELDS.recurringInvoice], dek)

    for (const ri of recurringInvoices) {
      if (ri.client) {
        decryptModelFields(ri.client, [...ENCRYPTED_FIELDS.client], dek)
      }
      decryptModelFieldsArray(ri.lines, [...ENCRYPTED_FIELDS.recurringInvoiceLine], dek)
    }

    const list = await Promise.all(
      recurringInvoices.map(async (ri) => {
        let subtotal = 0
        let taxAmount = 0
        for (const line of ri.lines) {
          const lt = line.quantity * line.unitPrice
          subtotal += lt
          taxAmount += lt * (line.vatRate / 100)
        }

        let discountAmount = 0
        if (ri.globalDiscountType === 'percentage' && ri.globalDiscountValue > 0) {
          discountAmount = subtotal * (ri.globalDiscountValue / 100)
        } else if (ri.globalDiscountType === 'fixed' && ri.globalDiscountValue > 0) {
          discountAmount = ri.globalDiscountValue
        }

        const total = subtotal + taxAmount - discountAmount

        return {
          ...(await ctx.serialize.withoutWrapping(RecurringInvoiceTransformer.transform(ri))),
          total: Math.round(total * 100) / 100,
        }
      })
    )

    return response.ok({ recurringInvoices: list })
  }
}
