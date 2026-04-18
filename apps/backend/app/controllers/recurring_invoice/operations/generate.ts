import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import RecurringInvoice from '#models/recurring_invoice/recurring_invoice'
import Invoice from '#models/invoice/invoice'
import InvoiceLine from '#models/invoice/invoice_line'
import InvoiceSetting from '#models/team/invoice_setting'
import { encryptModelFields } from '#services/crypto/field_encryption_helper'
import documentNumberingService from '#services/documents/document_numbering_service'

function computeNextDate(current: string, frequency: string, customDays: number | null): string {
  const d = new Date(current)
  switch (frequency) {
    case 'weekly':
      d.setDate(d.getDate() + 7)
      break
    case 'monthly':
      d.setMonth(d.getMonth() + 1)
      break
    case 'quarterly':
      d.setMonth(d.getMonth() + 3)
      break
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1)
      break
    case 'custom':
      d.setDate(d.getDate() + (customDays || 30))
      break
  }
  return d.toISOString().slice(0, 10)
}

export default class Generate {
  async handle(ctx: HttpContext) {
    const { auth, params, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const recurring = await RecurringInvoice.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!recurring) {
      return response.notFound({ message: 'Recurring invoice not found' })
    }

    const settings = await InvoiceSetting.query().where('team_id', teamId).first()
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
        .where('team_id', teamId)
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

    const today = new Date().toISOString().slice(0, 10)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + (recurring.dueDays || 30))
    const dueDateStr = dueDate.toISOString().slice(0, 10)

    // Calculate totals
    let subtotal = 0
    let taxAmount = 0
    for (const line of recurring.lines) {
      const lt = line.quantity * line.unitPrice
      subtotal += lt
      taxAmount += lt * (line.vatRate / 100)
    }

    let discountAmount = 0
    if (recurring.globalDiscountType === 'percentage' && recurring.globalDiscountValue > 0) {
      discountAmount = subtotal * (recurring.globalDiscountValue / 100)
    } else if (recurring.globalDiscountType === 'fixed' && recurring.globalDiscountValue > 0) {
      discountAmount = recurring.globalDiscountValue
    }

    const total = subtotal + taxAmount - discountAmount

    // Build invoice data — encrypted fields from recurring are already encrypted
    const invoiceData: Record<string, any> = {
      teamId,
      clientId: recurring.clientId,
      invoiceNumber,
      status: 'draft',
      subject: recurring.subject,
      issueDate: today,
      dueDate: dueDateStr,
      billingType: recurring.billingType,
      accentColor: recurring.accentColor,
      logoUrl: recurring.logoUrl,
      language: recurring.language,
      notes: recurring.notes,
      acceptanceConditions: recurring.acceptanceConditions,
      signatureField: recurring.signatureField,
      documentTitle: recurring.documentTitle || 'Facture',
      freeField: recurring.freeField,
      globalDiscountType: recurring.globalDiscountType,
      globalDiscountValue: recurring.globalDiscountValue,
      deliveryAddress: recurring.deliveryAddress,
      clientSiren: recurring.clientSiren,
      clientVatNumber: recurring.clientVatNumber,
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      paymentTerms: recurring.paymentTerms,
      paymentMethod: recurring.paymentMethod,
      bankAccountId: recurring.bankAccountId,
      vatExemptReason: recurring.vatExemptReason,
    }

    // documentTitle might not be encrypted if it was null in recurring — encrypt the fallback
    if (!recurring.documentTitle) {
      encryptModelFields(invoiceData, ['documentTitle'], dek)
    }

    const invoice = await db.transaction(async (trx) => {
      const inv = await Invoice.create(invoiceData, { client: trx })

      for (const line of recurring.lines) {
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

    // Update recurring invoice: advance next date, increment count
    recurring.lastGeneratedAt = DateTime.now()
    recurring.generationCount += 1
    recurring.nextExecutionDate = computeNextDate(
      recurring.nextExecutionDate,
      recurring.frequency,
      recurring.customIntervalDays
    )

    // Auto-deactivate if end date reached
    if (recurring.endDate && recurring.nextExecutionDate > recurring.endDate) {
      recurring.isActive = false
    }

    await recurring.save()

    return response.created({
      message: 'Invoice generated from recurring template',
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      },
      recurringInvoice: {
        nextExecutionDate: recurring.nextExecutionDate,
        generationCount: recurring.generationCount,
        isActive: recurring.isActive,
      },
    })
  }
}
