import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Invoice from '#models/invoice/invoice'
import {
  decryptModelFields,
  decryptModelFieldsArray,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'
import apiResponse from '#services/api/api_response'
import apiInvoiceTransformer from '#transformers/api_v2/api_invoice_transformer'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'
import webhookEmitter from '#services/api/webhook_event_emitter'
import { markPaidValidator } from '#validators/api_v2/invoice_validators'

export default class MarkPaid {
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

    if (invoice.status === 'paid') {
      return apiResponse.conflict(
        ctx.response,
        'conflict',
        'Invoice is already marked as paid',
        ctx.requestId
      )
    }
    if (invoice.status === 'draft') {
      return apiResponse.unprocessable(
        ctx.response,
        'business_rule_violation',
        'Cannot mark a draft as paid. Send the invoice first.',
        [{ field: 'status', code: 'invalid_state', message: `current: ${invoice.status}` }],
        ctx.requestId
      )
    }

    const payload = await markPaidValidator.validate(ctx.request.body())
    const paidAt = payload.paid_at
      ? DateTime.fromISO(payload.paid_at).toISODate()
      : DateTime.now().toISODate()
    const amountCents = payload.amount_cents ?? Math.round(Number(invoice.total) * 100)

    const expectedTotalCents = Math.round(Number(invoice.total) * 100)
    invoice.status = amountCents < expectedTotalCents ? 'partial' : 'paid'
    invoice.paidDate = paidAt
    if (payload.payment_method) invoice.paymentMethod = payload.payment_method
    await invoice.save()

    decryptModelFields(invoice, [...ENCRYPTED_FIELDS.invoice], dek)
    if (invoice.client) {
      decryptModelFields(invoice.client, [...ENCRYPTED_FIELDS.client], dek)
    }
    if (invoice.lines && invoice.lines.length > 0) {
      decryptModelFieldsArray(invoice.lines, [...ENCRYPTED_FIELDS.invoiceLine], dek)
    }

    const shape = apiInvoiceTransformer.transform(invoice, { includeLines: true })
    webhookEmitter
      .emit({
        type: invoice.status === 'partial' ? 'invoice.partially_paid' : 'invoice.paid',
        teamId: team.id,
        data: {
          invoice: shape,
          payment: {
            amount_cents: amountCents,
            method: payload.payment_method ?? null,
            reference: payload.reference ?? null,
            paid_at: paidAt,
          },
        },
      })
      .catch(() => {})

    return apiResponse.ok(ctx.response, shape)
  }
}
