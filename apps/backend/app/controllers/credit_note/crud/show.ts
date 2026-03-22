import type { HttpContext } from '@adonisjs/core/http'
import CreditNote from '#models/credit_note/credit_note'
import Invoice from '#models/invoice/invoice'
import CreditNoteTransformer from '#transformers/credit_note_transformer'
import {
  decryptModelFields,
  decryptModelFieldsArray,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'

export default class Show {
  async handle(ctx: HttpContext) {
    const { auth, params, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const creditNote = await CreditNote.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .preload('client')
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!creditNote) {
      return response.notFound({ message: 'Credit note not found' })
    }

    decryptModelFields(creditNote, [...ENCRYPTED_FIELDS.creditNote], dek)
    decryptModelFieldsArray(creditNote.lines, [...ENCRYPTED_FIELDS.creditNoteLine], dek)

    if (creditNote.client) {
      decryptModelFields(creditNote.client, [...ENCRYPTED_FIELDS.client], dek)
    }

    let sourceInvoice: { id: string; invoiceNumber: string } | null = null
    if (creditNote.sourceInvoiceId) {
      const invoice = await Invoice.find(creditNote.sourceInvoiceId)
      if (invoice) {
        sourceInvoice = { id: invoice.id, invoiceNumber: invoice.invoiceNumber }
      }
    }

    return response.ok({
      creditNote: {
        ...(await ctx.serialize.withoutWrapping(CreditNoteTransformer.transform(creditNote))),
        sourceInvoice,
      },
    })
  }
}
