import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Invoice from '#models/invoice/invoice'
import InvoiceLine from '#models/invoice/invoice_line'
import InvoiceSetting from '#models/team/invoice_setting'
import { createInvoiceValidator } from '#validators/invoice_validator'
import { encryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'

export default class Create {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const payload = await request.validateUsing(createInvoiceValidator)

    // Check for custom starting number
    const settings = await InvoiceSetting.query().where('team_id', teamId).first()
    let invoiceNumber: string

    if (settings?.nextInvoiceNumber) {
      invoiceNumber = settings.nextInvoiceNumber
      // Clear the custom starting number after first use
      settings.nextInvoiceNumber = null
      await settings.save()
    } else {
      // Generate next invoice number
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

    // Calculate totals from lines
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

    // Apply global discount
    let discountAmount = 0
    const discountType = payload.globalDiscountType || 'none'
    const discountValue = payload.globalDiscountValue || 0
    if (discountType === 'percentage' && discountValue > 0) {
      discountAmount = subtotal * (discountValue / 100)
    } else if (discountType === 'fixed' && discountValue > 0) {
      discountAmount = discountValue
    }

    const total = subtotal + taxAmount - discountAmount

    // Encrypt invoice fields
    const invoiceData: Record<string, any> = {
      teamId,
      clientId: payload.clientId || null,
      invoiceNumber,
      status: 'draft',
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
      sourceQuoteId: payload.sourceQuoteId || null,
      paymentTerms: payload.paymentTerms || null,
      paymentMethod: payload.paymentMethod || null,
      bankAccountId: payload.bankAccountId || null,
      vatExemptReason: payload.vatExemptReason || 'none',
    }

    encryptModelFields(invoiceData, [...ENCRYPTED_FIELDS.invoice], dek)

    const invoice = await db.transaction(async (trx) => {
      const inv = await Invoice.create(invoiceData, { client: trx })

      for (const lineData of linesData) {
        const lineRecord: Record<string, any> = {
          invoiceId: inv.id,
          ...lineData,
          total: Math.round(lineData.total * 100) / 100,
        }
        encryptModelFields(lineRecord, [...ENCRYPTED_FIELDS.invoiceLine], dek)
        await InvoiceLine.create(lineRecord, { client: trx })
      }

      return inv
    })

    return response.created({
      message: 'Invoice created',
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        total: invoice.total,
      },
    })
  }
}
