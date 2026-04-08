import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import CreditNote from '#models/credit_note/credit_note'
import CreditNoteLine from '#models/credit_note/credit_note_line'
import { createCreditNoteValidator } from '#validators/credit_note_validator'
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

    const creditNote = await CreditNote.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .first()

    if (!creditNote) {
      return response.notFound({ message: 'Credit note not found' })
    }

    const payload = await request.validateUsing(createCreditNoteValidator)

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

    const updateData: Record<string, any> = {
      clientId: payload.clientId || null,
      sourceInvoiceId: payload.sourceInvoiceId || null,
      reason: payload.reason || null,
      subject: payload.subject || null,
      issueDate: payload.issueDate,
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
      vatExemptReason: payload.vatExemptReason || 'none',
    }

    encryptModelFields(updateData, [...ENCRYPTED_FIELDS.creditNote], dek)

    await db.transaction(async (trx) => {
      creditNote.useTransaction(trx)
      creditNote.merge(updateData)
      await creditNote.save()

      await CreditNoteLine.query({ client: trx }).where('credit_note_id', creditNote.id).delete()

      for (const lineData of linesData) {
        const lineRecord: Record<string, any> = {
          creditNoteId: creditNote.id,
          ...lineData,
          total: Math.round(lineData.total * 100) / 100,
        }
        encryptModelFields(lineRecord, [...ENCRYPTED_FIELDS.creditNoteLine], dek)
        await CreditNoteLine.create(lineRecord, { client: trx })
      }
    })

    broadcastDocumentSaved('credit_note', creditNote.id, user.id)

    return response.ok({
      message: 'Credit note updated',
      creditNote: {
        id: creditNote.id,
        creditNoteNumber: creditNote.creditNoteNumber,
        status: creditNote.status,
        total: Math.round(total * 100) / 100,
      },
    })
  }
}
