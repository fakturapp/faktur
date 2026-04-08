import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import CreditNote from '#models/credit_note/credit_note'
import CreditNoteLine from '#models/credit_note/credit_note_line'

export default class Duplicate {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const source = await CreditNote.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!source) {
      return response.notFound({ message: 'Credit note not found' })
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

    const creditNote = await db.transaction(async (trx) => {
      const cn = await CreditNote.create(
        {
          teamId,
          clientId: source.clientId,
          sourceInvoiceId: source.sourceInvoiceId,
          creditNoteNumber,
          status: 'draft',
          reason: source.reason,
          subject: source.subject,
          issueDate: today,
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
          subtotal: source.subtotal,
          taxAmount: source.taxAmount,
          total: source.total,
          vatExemptReason: source.vatExemptReason,
        },
        { client: trx }
      )

      for (const line of source.lines) {
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
      message: 'Credit note duplicated',
      creditNote: { id: creditNote.id, creditNoteNumber: creditNote.creditNoteNumber },
    })
  }
}
