import type { HttpContext } from '@adonisjs/core/http'
import Invoice from '#models/invoice/invoice'
import {
  decryptModelFields,
  decryptModelFieldsArray,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'
import apiResponse from '#services/api/api_response'
import apiInvoiceTransformer from '#transformers/api_v2/api_invoice_transformer'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'

export default class Show {
  async handle(ctx: HttpContext) {
    const team = ctx.team!
    const dek = ctx.dek!

    let internalId: string
    try {
      internalId = publicIdCodec.decode('invoice', ctx.params.id)
    } catch (err) {
      if (err instanceof PublicIdParseError) {
        return apiResponse.notFound(
          ctx.response,
          'resource_not_found',
          'Invoice not found',
          ctx.requestId
        )
      }
      throw err
    }

    const invoice = await Invoice.query()
      .where('id', internalId)
      .where('team_id', team.id)
      .preload('client')
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!invoice) {
      return apiResponse.notFound(
        ctx.response,
        'resource_not_found',
        'Invoice not found',
        ctx.requestId
      )
    }

    decryptModelFields(invoice, [...ENCRYPTED_FIELDS.invoice], dek)
    if (invoice.client) {
      decryptModelFields(invoice.client, [...ENCRYPTED_FIELDS.client], dek)
    }
    if (invoice.lines && invoice.lines.length > 0) {
      decryptModelFieldsArray(invoice.lines, [...ENCRYPTED_FIELDS.invoiceLine], dek)
    }

    return apiResponse.ok(
      ctx.response,
      apiInvoiceTransformer.transform(invoice, { includeLines: true })
    )
  }
}
