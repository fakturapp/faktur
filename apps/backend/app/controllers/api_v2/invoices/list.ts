import type { HttpContext } from '@adonisjs/core/http'
import Invoice from '#models/invoice/invoice'
import { decryptModelFieldsArray, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'
import apiResponse from '#services/api/api_response'
import apiPagination from '#services/api/api_pagination'
import apiInvoiceTransformer from '#transformers/api_v2/api_invoice_transformer'
import publicIdCodec from '#services/api/public_id_codec'
import { listInvoicesValidator } from '#validators/api_v2/invoice_validators'

export default class List {
  async handle(ctx: HttpContext) {
    const team = ctx.team!
    const dek = ctx.dek!

    const payload = await listInvoicesValidator.validate(ctx.request.qs())
    const { limit, cursor } = apiPagination.parse({
      limit: payload.limit,
      cursor: payload.cursor,
    })

    const query = Invoice.query()
      .where('team_id', team.id)
      .limit(limit + 1)

    if (payload.status) {
      const statuses = payload.status
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      if (statuses.length > 0) query.whereIn('status', statuses)
    }

    if (payload.client_id) {
      const internalClientId = publicIdCodec.tryDecode('client', payload.client_id)
      if (internalClientId) query.where('client_id', internalClientId)
    }

    if (payload.issue_date_after) query.where('issue_date', '>=', payload.issue_date_after)
    if (payload.issue_date_before) query.where('issue_date', '<=', payload.issue_date_before)
    if (payload.due_date_after) query.where('due_date', '>=', payload.due_date_after)
    if (payload.due_date_before) query.where('due_date', '<=', payload.due_date_before)

    if (cursor) {
      query.where((q) => {
        q.where('created_at', '<', cursor.created_at).orWhere((sub) => {
          sub.where('created_at', cursor.created_at).where('id', '<', cursor.id)
        })
      })
    }

    const sortKey = payload.sort ?? '-created_at'
    if (sortKey === 'created_at') query.orderBy('created_at', 'asc').orderBy('id', 'asc')
    else if (sortKey === 'issue_date') query.orderBy('issue_date', 'asc').orderBy('id', 'asc')
    else if (sortKey === '-issue_date') query.orderBy('issue_date', 'desc').orderBy('id', 'desc')
    else query.orderBy('created_at', 'desc').orderBy('id', 'desc')

    const rows = await query
    decryptModelFieldsArray(rows, [...ENCRYPTED_FIELDS.invoice], dek)

    let filtered = rows
    if (payload.q) {
      const needle = payload.q.toLowerCase()
      filtered = filtered.filter((inv) => {
        const haystack = [inv.invoiceNumber, inv.subject, inv.notes]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(needle)
      })
    }

    const page = apiPagination.buildNext(filtered, limit)
    const data = apiInvoiceTransformer.transformMany(page.items)

    return apiResponse.list(ctx.response, data, {
      has_more: page.hasMore,
      next_cursor: page.nextCursor,
      limit,
    })
  }
}
