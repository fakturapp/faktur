import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Invoice from '#models/invoice/invoice'
import InvoiceLine from '#models/invoice/invoice_line'
import InvoiceSetting from '#models/team/invoice_setting'
import Client from '#models/client/client'
import {
  decryptModelFields,
  decryptModelFieldsArray,
  encryptModelFields,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'
import documentNumberingService from '#services/documents/document_numbering_service'
import apiResponse from '#services/api/api_response'
import apiInvoiceTransformer from '#transformers/api_v2/api_invoice_transformer'
import publicIdCodec from '#services/api/public_id_codec'
import webhookEmitter from '#services/api/webhook_event_emitter'
import { computePricing } from '#services/api/invoice_pricing'
import { createInvoiceV2Validator } from '#validators/api_v2/invoice_write_validators'

export default class Create {
  async handle(ctx: HttpContext) {
    const team = ctx.team!
    const dek = ctx.dek!

    const payload = await createInvoiceV2Validator.validate(ctx.request.body())

    const clientInternalId = publicIdCodec.tryDecode('client', payload.client_id)
    if (!clientInternalId) {
      return apiResponse.unprocessable(
        ctx.response,
        'validation_failed',
        'Invalid client_id format',
        [{ field: 'client_id', code: 'invalid_format' }],
        ctx.requestId
      )
    }

    const client = await Client.query()
      .where('id', clientInternalId)
      .where('team_id', team.id)
      .first()
    if (!client) {
      return apiResponse.notFound(
        ctx.response,
        'resource_not_found',
        'Client not found',
        ctx.requestId
      )
    }

    const bankAccountInternalId = payload.bank_account_id
      ? publicIdCodec.tryDecode('bank_account', payload.bank_account_id)
      : null

    const settings = await InvoiceSetting.query().where('team_id', team.id).first()
    let invoiceNumber: string
    if (settings?.nextInvoiceNumber) {
      invoiceNumber = documentNumberingService.normalizePattern(
        settings.nextInvoiceNumber,
        'FAC-{annee}-{numero}'
      )
      settings.nextInvoiceNumber = null
      await settings.save()
    } else {
      const currentYear = new Date().getFullYear().toString()
      const fallbackPattern = 'FAC-{annee}-{numero}'
      const prefix = documentNumberingService.buildSequencePrefix(
        settings?.invoiceNumberPattern || settings?.invoiceFilenamePattern,
        fallbackPattern,
        currentYear
      )
      const lastInvoice = await Invoice.query()
        .where('team_id', team.id)
        .where('invoice_number', 'like', `${prefix}%`)
        .orderBy('created_at', 'desc')
        .first()
      invoiceNumber = documentNumberingService.buildNextSequentialNumber({
        pattern: settings?.invoiceNumberPattern || settings?.invoiceFilenamePattern,
        fallbackPattern,
        currentYear,
        lastNumber: lastInvoice?.invoiceNumber,
      })
    }

    const pricing = computePricing(payload.lines, {
      discount_type: payload.global_discount_type,
      discount_value: payload.global_discount_value,
    })

    const invoiceData: Record<string, any> = {
      teamId: team.id,
      clientId: clientInternalId,
      invoiceNumber,
      status: 'draft',
      subject: payload.subject ?? null,
      issueDate: payload.issue_date,
      dueDate: payload.due_date ?? null,
      billingType: 'detailed',
      accentColor: '#0066cc',
      language: payload.language ?? 'fr',
      notes: payload.notes ?? null,
      signatureField: false,
      globalDiscountType: payload.global_discount_type ?? 'none',
      globalDiscountValue: payload.global_discount_value ?? 0,
      showQuantityColumn: true,
      showUnitColumn: true,
      showUnitPriceColumn: true,
      showVatColumn: true,
      subtotal: pricing.subtotal_cents / 100,
      taxAmount: pricing.tax_cents / 100,
      total: pricing.total_cents / 100,
      paymentTerms: payload.payment_terms ?? null,
      bankAccountId: bankAccountInternalId,
      sourceQuoteId: payload.source_quote_id
        ? publicIdCodec.tryDecode('quote', payload.source_quote_id)
        : null,
      vatExemptReason: payload.vat_exempt_reason ?? 'none',
      vatOnDebits: payload.vat_on_debits ?? false,
      operationCategory: payload.operation_category ?? null,
      deliveryAddress: payload.delivery_address ?? null,
    }

    encryptModelFields(invoiceData, [...ENCRYPTED_FIELDS.invoice], dek)

    const invoice = await db.transaction(async (trx) => {
      const inv = await Invoice.create(invoiceData, { client: trx })
      for (let i = 0; i < payload.lines.length; i++) {
        const line = payload.lines[i]
        const lineRecord: Record<string, any> = {
          invoiceId: inv.id,
          position: i,
          description: line.description,
          saleType: line.sale_type ?? null,
          quantity: line.quantity,
          unit: line.unit ?? null,
          unitPrice: line.unit_price_cents / 100,
          vatRate: line.vat_rate,
          total: pricing.line_totals_cents[i] / 100,
        }
        encryptModelFields(lineRecord, [...ENCRYPTED_FIELDS.invoiceLine], dek)
        await InvoiceLine.create(lineRecord, { client: trx })
      }
      return inv
    })

    const reloaded = await Invoice.query()
      .where('id', invoice.id)
      .preload('client')
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .firstOrFail()

    decryptModelFields(reloaded, [...ENCRYPTED_FIELDS.invoice], dek)
    if (reloaded.client) {
      decryptModelFields(reloaded.client, [...ENCRYPTED_FIELDS.client], dek)
    }
    if (reloaded.lines && reloaded.lines.length > 0) {
      decryptModelFieldsArray(reloaded.lines, [...ENCRYPTED_FIELDS.invoiceLine], dek)
    }

    const shape = apiInvoiceTransformer.transform(reloaded, { includeLines: true })

    webhookEmitter
      .emit({ type: 'invoice.created', teamId: team.id, data: { invoice: shape } })
      .catch(() => {})

    return apiResponse.created(ctx.response, shape)
  }
}
