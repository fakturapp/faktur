import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Quote from '#models/quote/quote'
import QuoteTransformer from '#transformers/quote_transformer'
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

    const quote = await Quote.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .preload('client')
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!quote) {
      return response.notFound({ message: 'Quote not found' })
    }

    // Auto-transition sent → expired when validity date has passed
    if (quote.status === 'sent' && quote.validityDate) {
      const today = DateTime.now().toSQLDate()!
      if (quote.validityDate < today) {
        quote.status = 'expired'
        await quote.save()
      }
    }

    decryptModelFields(quote, [...ENCRYPTED_FIELDS.quote], dek)
    decryptModelFieldsArray(quote.lines, [...ENCRYPTED_FIELDS.quoteLine], dek)

    if (quote.client) {
      decryptModelFields(quote.client, [...ENCRYPTED_FIELDS.client], dek)
    }

    return response.ok({
      quote: await ctx.serialize.withoutWrapping(QuoteTransformer.transform(quote)),
    })
  }
}
