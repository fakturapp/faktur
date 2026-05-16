import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product/product'
import {
  decryptModelFieldsArray,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'
import apiResponse from '#services/api/api_response'
import apiPagination from '#services/api/api_pagination'
import apiProductTransformer from '#transformers/api_v2/api_product_transformer'
import { listProductsValidator } from '#validators/api_v2/product_validators'

export default class List {
  async handle(ctx: HttpContext) {
    const team = ctx.team!
    const dek = ctx.dek!

    const payload = await listProductsValidator.validate(ctx.request.qs())
    const { limit, cursor } = apiPagination.parse({
      limit: payload.limit,
      cursor: payload.cursor,
    })

    const query = Product.query()
      .where('team_id', team.id)
      .limit(limit + 1)

    if (typeof payload.archived === 'boolean') query.where('is_archived', payload.archived)

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
    decryptModelFieldsArray(rows, [...ENCRYPTED_FIELDS.product], dek)

    let filtered = rows
    if (payload.q) {
      const needle = payload.q.toLowerCase()
      filtered = filtered.filter((p) => {
        const haystack = [p.name, p.description, p.reference].filter(Boolean).join(' ').toLowerCase()
        return haystack.includes(needle)
      })
    }

    const page = apiPagination.buildNext(filtered, limit)
    const data = apiProductTransformer.transformMany(page.items)

    return apiResponse.list(ctx.response, data, {
      has_more: page.hasMore,
      next_cursor: page.nextCursor,
      limit,
    })
  }
}
