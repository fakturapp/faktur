import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Invoice from '#models/invoice/invoice'
import InvoiceLine from '#models/invoice/invoice_line'
import InvoiceSetting from '#models/team/invoice_setting'
import {
  decryptModelFields,
  decryptModelFieldsArray,
  encryptModelFields,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'
import documentNumberingService from '#services/documents/document_numbering_service'
import apiResponse from '#services/api/api_response'
import apiInvoiceTransformer from '#transformers/api_v2/api_invoice_transformer'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'
import webhookEmitter from '#services/api/webhook_event_emitter'

export default class Duplicate {
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

    const source = await Invoice.query()
      .where('id', internalId)
      .where('team_id', team.id)
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .first()
    if (!source) {
      return apiResponse.notFound(
        ctx.response,
        'resource_not_found',
        'Invoice not found',
        ctx.requestId
      )
    }

    decryptModelFields(source, [...ENCRYPTED_FIELDS.invoice], dek)
    decryptModelFieldsArray(source.lines, [...ENCRYPTED_FIELDS.invoiceLine], dek)

    const settings = await InvoiceSetting.query().where('team_id', team.id).first()
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
    const invoiceNumber = documentNumberingService.buildNextSequentialNumber({
      pattern: settings?.invoiceNumberPattern || settings?.invoiceFilenamePattern,
      fallbackPattern,
      currentYear,
      lastNumber: lastInvoice?.invoiceNumber,
    })

    const duplicateData: Record<string, any> = {
      teamId: team.id,
      clientId: source.clientId,
      invoiceNumber,
      status: 'draft',
      subject: source.subject,
      issueDate: new Date().toISOString().slice(0, 10),
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
      showQuantityColumn: source.showQuantityColumn,
      showUnitColumn: source.showUnitColumn,
      showUnitPriceColumn: source.showUnitPriceColumn,
      showVatColumn: source.showVatColumn,
      subtotal: source.subtotal,
      taxAmount: source.taxAmount,
      total: source.total,
      paymentTerms: source.paymentTerms,
      paymentMethod: source.paymentMethod,
      bankAccountId: source.bankAccountId,
      vatExemptReason: source.vatExemptReason,
      vatOnDebits: source.vatOnDebits,
      operationCategory: source.operationCategory,
    }
    encryptModelFields(duplicateData, [...ENCRYPTED_FIELDS.invoice], dek)

    const created = await db.transaction(async (trx) => {
      const inv = await Invoice.create(duplicateData, { client: trx })
      for (const line of source.lines) {
        const lineRecord: Record<string, any> = {
          invoiceId: inv.id,
          position: line.position,
          description: line.description,
          saleType: line.saleType,
          quantity: line.quantity,
          unit: line.unit,
          unitPrice: line.unitPrice,
          vatRate: line.vatRate,
          total: line.total,
        }
        encryptModelFields(lineRecord, [...ENCRYPTED_FIELDS.invoiceLine], dek)
        await InvoiceLine.create(lineRecord, { client: trx })
      }
      return inv
    })

    const reloaded = await Invoice.query()
      .where('id', created.id)
      .preload('client')
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .firstOrFail()
    decryptModelFields(reloaded, [...ENCRYPTED_FIELDS.invoice], dek)
    if (reloaded.client) {
      decryptModelFields(reloaded.client, [...ENCRYPTED_FIELDS.client], dek)
    }
    decryptModelFieldsArray(reloaded.lines, [...ENCRYPTED_FIELDS.invoiceLine], dek)

    const shape = apiInvoiceTransformer.transform(reloaded, { includeLines: true })

    webhookEmitter
      .emit({ type: 'invoice.created', teamId: team.id, data: { invoice: shape } })
      .catch(() => {})

    return apiResponse.created(ctx.response, shape)
  }
}
