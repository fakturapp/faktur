import type { HttpContext } from '@adonisjs/core/http'
import Quote from '#models/quote/quote'
import {
  decryptModelFields,
  decryptModelFieldsArray,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'
import apiResponse from '#services/api/api_response'
import apiQuoteTransformer from '#transformers/api_v2/api_quote_transformer'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'

export default class Show {
  async handle(ctx: HttpContext) {
    const team = ctx.team!
    const dek = ctx.dek!

    let internalId: string
    try {
      internalId = publicIdCodec.decode('quote', ctx.params.id)
    } catch (err) {
      if (err instanceof PublicIdParseError) {
        return apiResponse.notFound(
          ctx.response,
          'resource_not_found',
          'Quote not found',
          ctx.requestId
        )
      }
      throw err
    }

    const quote = await Quote.query()
      .where('id', internalId)
      .where('team_id', team.id)
      .preload('client')
      .preload('lines')
      .first()

    if (!quote) {
      return apiResponse.notFound(
        ctx.response,
        'resource_not_found',
        'Quote not found',
        ctx.requestId
      )
    }

    decryptModelFields(quote, [...ENCRYPTED_FIELDS.quote], dek)
    if (quote.client) {
      decryptModelFields(quote.client, [...ENCRYPTED_FIELDS.client], dek)
    }
    if (quote.lines && quote.lines.length > 0) {
      decryptModelFieldsArray(quote.lines, [...ENCRYPTED_FIELDS.invoiceLine], dek)
    }

    return apiResponse.ok(
      ctx.response,
      apiQuoteTransformer.transform(quote, { includeLines: true })
    )
  }
}
