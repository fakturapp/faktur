import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Invoice from '#models/invoice/invoice'
import InvoiceLine from '#models/invoice/invoice_line'
import { createInvoiceValidator } from '#validators/invoice_validator'
import { encryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'
import { broadcastDocumentSaved } from '#services/collaboration/websocket_service'

export default class Update {
  async handle(ctx: HttpContext) {
    const { auth, params, request, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const invoice = await Invoice.query().where('id', params.id).where('team_id', teamId).first()

    if (!invoice) {
      return response.notFound({ message: 'Invoice not found' })
    }

    const payload = await request.validateUsing(createInvoiceValidator)

    let subtotal = 0
    let taxAmount = 0
    const linesData = payload.lines.map((line, index) => {
      const lineTotal = line.quantity * line.unitPrice
      const lineTax = lineTotal * (line.vatRate / 100)
      subtotal += lineTotal
      taxAmount += lineTax
      return {
        position: index,
        description: line.description,
        saleType: line.saleType || null,
        quantity: line.quantity,
        unit: line.unit || null,
        unitPrice: line.unitPrice,
        vatRate: line.vatRate,
        total: lineTotal,
      }
    })

    let discountAmount = 0
    const discountType = payload.globalDiscountType || 'none'
    const discountValue = payload.globalDiscountValue || 0
    if (discountType === 'percentage' && discountValue > 0) {
      discountAmount = subtotal * (discountValue / 100)
    } else if (discountType === 'fixed' && discountValue > 0) {
      discountAmount = discountValue
    }

    const total = subtotal + taxAmount - discountAmount

    const invoiceUpdateData: Record<string, any> = {
      clientId: payload.clientId || null,
      subject: payload.subject || null,
      issueDate: payload.issueDate,
      dueDate: payload.dueDate || null,
      billingType: payload.billingType,
      accentColor: payload.accentColor,
      logoUrl: payload.logoUrl || null,
      language: payload.language || 'fr',
      notes: payload.notes || null,
      acceptanceConditions: payload.acceptanceConditions || null,
      signatureField: payload.signatureField ?? false,
      documentTitle: payload.documentTitle || null,
      freeField: payload.freeField || null,
      globalDiscountType: discountType,
      globalDiscountValue: discountValue,
      deliveryAddress: payload.deliveryAddress || null,
      clientSiren: payload.clientSiren || null,
      clientVatNumber: payload.clientVatNumber || null,
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      paymentTerms: payload.paymentTerms !== undefined ? payload.paymentTerms || null : invoice.paymentTerms,
      paymentMethod: payload.paymentMethod || null,
      bankAccountId: payload.bankAccountId || null,
      vatExemptReason: payload.vatExemptReason || 'none',
      clientSnapshot: payload.clientSnapshot ? JSON.stringify(payload.clientSnapshot) : null,
      companySnapshot: payload.companySnapshot ? JSON.stringify(payload.companySnapshot) : null,
    }

    encryptModelFields(invoiceUpdateData, [...ENCRYPTED_FIELDS.invoice], dek)

    await db.transaction(async (trx) => {
      invoice.useTransaction(trx)
      invoice.merge(invoiceUpdateData)
      await invoice.save()

      await InvoiceLine.query({ client: trx }).where('invoice_id', invoice.id).delete()

      for (const lineData of linesData) {
        const lineRecord: Record<string, any> = {
          invoiceId: invoice.id,
          ...lineData,
          total: Math.round(lineData.total * 100) / 100,
        }
        encryptModelFields(lineRecord, [...ENCRYPTED_FIELDS.invoiceLine], dek)
        await InvoiceLine.create(lineRecord, { client: trx })
      }
    })

    broadcastDocumentSaved('invoice', invoice.id, user.id)

    return response.ok({
      message: 'Invoice updated',
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        total: Math.round(total * 100) / 100,
      },
    })
  }
}
