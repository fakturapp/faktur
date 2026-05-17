import type { HttpContext } from '@adonisjs/core/http'
import CreditNote from '#models/credit_note/credit_note'
import { decryptModelFieldsArray, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'
import apiResponse from '#services/api/api_response'
import apiPagination from '#services/api/api_pagination'
import apiCreditNoteTransformer from '#transformers/api_v2/api_credit_note_transformer'

export default class List {
  async handle(ctx: HttpContext) {
    const team = ctx.team!
    const dek = ctx.dek!

    const { limit, cursor } = apiPagination.parse(ctx.request.qs())

    const query = CreditNote.query()
      .where('team_id', team.id)
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .limit(limit + 1)

    if (cursor) {
      query.where((q) => {
        q.where('created_at', '<', cursor.created_at).orWhere((sub) => {
          sub.where('created_at', cursor.created_at).where('id', '<', cursor.id)
        })
      })
    }

    const rows = await query
    decryptModelFieldsArray(rows, [...ENCRYPTED_FIELDS.creditNote], dek)

    const page = apiPagination.buildNext(rows, limit)
    return apiResponse.list(ctx.response, apiCreditNoteTransformer.transformMany(page.items), {
      has_more: page.hasMore,
      next_cursor: page.nextCursor,
      limit,
    })
  }
}
