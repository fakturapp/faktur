import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Quote from '#models/quote/quote'
import QuoteTransformer from '#transformers/quote_transformer'
import {
  decryptModelFields,
  decryptModelFieldsArray,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'
import { ApiError } from '#exceptions/api_error'

export default class List {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      throw new ApiError('team_not_selected')
    }

    await Quote.query()
      .where('teamId', teamId)
      .where('status', 'sent')
      .whereNotNull('validityDate')
      .where('validityDate', '<', DateTime.now().toSQLDate()!)
      .update({ status: 'expired' })

    const status = request.input('status', '')
    const clientId = request.input('clientId', '')
    const issueDateFrom = request.input('issueDateFrom', '')
    const issueDateTo = request.input('issueDateTo', '')
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)

    const query = Quote.query()
      .where('team_id', teamId)
      .preload('client')
      .orderBy('created_at', 'desc')

    if (status) {
      query.where('status', status)
    }

    if (clientId) {
      query.where('client_id', clientId)
    }

    if (issueDateFrom) {
      query.where('issue_date', '>=', issueDateFrom)
    }

    if (issueDateTo) {
      query.where('issue_date', '<=', issueDateTo)
    }

    const search = request.input('search', '')
    if (search) {
      query.whereILike('quote_number', `%${search}%`)
    }

    const result = await query.paginate(page, perPage)
    const quotes = result.all()

    decryptModelFieldsArray(quotes, [...ENCRYPTED_FIELDS.quote], dek)

    for (const q of quotes) {
      if (q.client) {
        decryptModelFields(q.client, [...ENCRYPTED_FIELDS.client], dek)
      }
    }

    return response.ok({
      quotes: await ctx.serialize.withoutWrapping(QuoteTransformer.transform(quotes)),
      meta: {
        total: result.total,
        perPage: result.perPage,
        currentPage: result.currentPage,
        lastPage: result.lastPage,
      },
    })
  }
}
