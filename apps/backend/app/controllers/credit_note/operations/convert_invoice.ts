import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Invoice from '#models/invoice/invoice'
import CreditNote from '#models/credit_note/credit_note'
import CreditNoteLine from '#models/credit_note/credit_note_line'
import { encryptModelFields } from '#services/crypto/field_encryption_helper'

export default class ConvertInvoice {
  async handle(ctx: HttpContext) {
    const { auth, params, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const invoice = await Invoice.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!invoice) {
      return response.notFound({ message: 'Invoice not found' })
    }

    const currentYear = new Date().getFullYear().toString()
    const prefix = `AV-${currentYear}-`

    const lastCreditNote = await CreditNote.query()
      .where('team_id', teamId)
      .where('credit_note_number', 'like', `${prefix}%`)
      .orderBy('created_at', 'desc')
      .first()

    let nextNum = 1
    if (lastCreditNote) {
      const numStr = lastCreditNote.creditNoteNumber.slice(prefix.length)
      const parsed = Number.parseInt(numStr, 10)
      if (!Number.isNaN(parsed)) nextNum = parsed + 1
    }

    const creditNoteNumber = `${prefix}${nextNum.toString().padStart(3, '0')}`
    const today = new Date().toISOString().slice(0, 10)

    // Build credit note data — encrypted fields from invoice are already encrypted,
    // but hardcoded plaintext fields need encryption.
    const creditNoteData: Record<string, any> = {
      teamId,
      clientId: invoice.clientId,
      sourceInvoiceId: invoice.id,
      creditNoteNumber,
      status: 'draft',
      reason: null,
      subject: invoice.subject,
      issueDate: today,
      billingType: invoice.billingType,
      accentColor: invoice.accentColor,
      logoUrl: invoice.logoUrl,
      language: invoice.language,
      notes: invoice.notes,
      acceptanceConditions: invoice.acceptanceConditions,
      signatureField: invoice.signatureField,
      documentTitle: 'Avoir',
      freeField: invoice.freeField,
      globalDiscountType: invoice.globalDiscountType,
      globalDiscountValue: invoice.globalDiscountValue,
      deliveryAddress: invoice.deliveryAddress,
      clientSiren: invoice.clientSiren,
      clientVatNumber: invoice.clientVatNumber,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      vatExemptReason: invoice.vatExemptReason,
    }

    // Only encrypt the hardcoded plaintext fields — the rest are already encrypted from invoice
    encryptModelFields(creditNoteData, ['documentTitle'], dek)

    const creditNote = await db.transaction(async (trx) => {
      const cn = await CreditNote.create(creditNoteData, { client: trx })

      // Lines are already encrypted in the DB, copy as-is
      for (const line of invoice.lines) {
        await CreditNoteLine.create(
          {
            creditNoteId: cn.id,
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

      return cn
    })

    return response.created({
      message: 'Credit note created from invoice',
      creditNote: {
        id: creditNote.id,
        creditNoteNumber: creditNote.creditNoteNumber,
      },
    })
  }
}
