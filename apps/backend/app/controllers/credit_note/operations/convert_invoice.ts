import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Invoice from '#models/invoice/invoice'
import CreditNote from '#models/credit_note/credit_note'
import CreditNoteLine from '#models/credit_note/credit_note_line'
import InvoiceSetting from '#models/team/invoice_setting'
import { encryptModelFields } from '#services/crypto/field_encryption_helper'
import { ApiError } from '#exceptions/api_error'
import { generateNextNumber } from '#services/documents/number_generator'

export default class ConvertInvoice {
  async handle(ctx: HttpContext) {
    const { auth, params, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      throw new ApiError('team_not_selected')
    }

    const invoice = await Invoice.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!invoice) {
      throw new ApiError('invoice_not_found')
    }

    const settings = await InvoiceSetting.query().where('team_id', teamId).first()
    let creditNoteNumber: string

    if (settings?.nextCreditNoteNumber) {
      creditNoteNumber = settings.nextCreditNoteNumber
      settings.nextCreditNoteNumber = null
      await settings.save()
    } else {
      creditNoteNumber = await generateNextNumber({
        teamId,
        table: 'credit_notes',
        numberColumn: 'credit_note_number',
        pattern: settings?.creditNoteFilenamePattern || 'AV-{annee}-{numero}',
      })
    }

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
      clientSnapshot: invoice.clientSnapshot,
      companySnapshot: invoice.companySnapshot,
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
