import type { HttpContext } from '@adonisjs/core/http'
import RecurringInvoice from '#models/recurring_invoice/recurring_invoice'
import RecurringInvoiceTransformer from '#transformers/recurring_invoice_transformer'
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

    const recurring = await RecurringInvoice.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .preload('client')
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!recurring) {
      return response.notFound({ message: 'Recurring invoice not found' })
    }

    decryptModelFields(recurring, [...ENCRYPTED_FIELDS.recurringInvoice], dek)
    decryptModelFieldsArray(recurring.lines, [...ENCRYPTED_FIELDS.recurringInvoiceLine], dek)

    if (recurring.client) {
      decryptModelFields(recurring.client, [...ENCRYPTED_FIELDS.client], dek)
    }

    return response.ok({
      recurringInvoice: await ctx.serialize.withoutWrapping(
        RecurringInvoiceTransformer.transform(recurring)
      ),
    })
  }
}
