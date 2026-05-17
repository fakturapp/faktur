import type { HttpContext } from '@adonisjs/core/http'
import RecurringInvoice from '#models/recurring_invoice/recurring_invoice'
import { decryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'
import apiResponse from '#services/api/api_response'
import apiRecurringInvoiceTransformer from '#transformers/api_v2/api_recurring_invoice_transformer'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'

export default class Show {
  async handle(ctx: HttpContext) {
    const team = ctx.team!
    const dek = ctx.dek!

    let internalId: string
    try {
      internalId = publicIdCodec.decode('recurring_invoice', ctx.params.id)
    } catch (err) {
      if (err instanceof PublicIdParseError) {
        return apiResponse.notFound(
          ctx.response,
          'resource_not_found',
          'Recurring invoice not found',
          ctx.requestId
        )
      }
      throw err
    }

    const r = await RecurringInvoice.query()
      .where('id', internalId)
      .where('team_id', team.id)
      .first()
    if (!r) {
      return apiResponse.notFound(
        ctx.response,
        'resource_not_found',
        'Recurring invoice not found',
        ctx.requestId
      )
    }
    if ((ENCRYPTED_FIELDS as Record<string, readonly string[]>).recurringInvoice) {
      decryptModelFields(
        r,
        [...(ENCRYPTED_FIELDS as Record<string, readonly string[]>).recurringInvoice!],
        dek
      )
    }
    return apiResponse.ok(ctx.response, apiRecurringInvoiceTransformer.transform(r))
  }
}
