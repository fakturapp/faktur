import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client/client'
import { decryptModelFieldsArray, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'
import apiResponse from '#services/api/api_response'
import apiPagination from '#services/api/api_pagination'
import apiClientTransformer from '#transformers/api_v2/api_client_transformer'
import { listClientsValidator } from '#validators/api_v2/client_validators'

export default class List {
  async handle(ctx: HttpContext) {
    const team = ctx.team!
    const dek = ctx.dek!

    const payload = await listClientsValidator.validate(ctx.request.qs())
    const { limit, cursor } = apiPagination.parse({
      limit: payload.limit,
      cursor: payload.cursor,
    })

    const query = Client.query()
      .where('team_id', team.id)
      .limit(limit + 1)

    if (payload.type) query.where('type', payload.type)

    if (cursor) {
      query.where((q) => {
        q.where('created_at', '<', cursor.created_at).orWhere((sub) => {
          sub.where('created_at', cursor.created_at).where('id', '<', cursor.id)
        })
      })
    }

    const sortKey = payload.sort ?? '-created_at'
    if (sortKey === 'created_at') query.orderBy('created_at', 'asc').orderBy('id', 'asc')
    else query.orderBy('created_at', 'desc').orderBy('id', 'desc')

    const rows = await query
    decryptModelFieldsArray(rows, [...ENCRYPTED_FIELDS.client], dek)

    let filtered = rows
    if (payload.q) {
      const needle = payload.q.toLowerCase()
      filtered = filtered.filter((c) => {
        const haystack = [c.companyName, c.firstName, c.lastName, c.email, c.siren, c.siret]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(needle)
      })
    }
    if (payload.email) {
      filtered = filtered.filter((c) => c.email?.toLowerCase() === payload.email!.toLowerCase())
    }
    if (payload.siren) {
      filtered = filtered.filter((c) => c.siren === payload.siren)
    }

    const page = apiPagination.buildNext(filtered, limit)
    const data = apiClientTransformer.transformMany(page.items)

    return apiResponse.list(ctx.response, data, {
      has_more: page.hasMore,
      next_cursor: page.nextCursor,
      limit,
    })
  }
}
