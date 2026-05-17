import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product/product'
import { decryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'
import apiResponse from '#services/api/api_response'
import apiProductTransformer from '#transformers/api_v2/api_product_transformer'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'

export default class Show {
  async handle(ctx: HttpContext) {
    const team = ctx.team!
    const dek = ctx.dek!

    let internalId: string
    try {
      internalId = publicIdCodec.decode('product', ctx.params.id)
    } catch (err) {
      if (err instanceof PublicIdParseError) {
        return apiResponse.notFound(
          ctx.response,
          'resource_not_found',
          'Product not found',
          ctx.requestId
        )
      }
      throw err
    }

    const product = await Product.query().where('id', internalId).where('team_id', team.id).first()
    if (!product) {
      return apiResponse.notFound(
        ctx.response,
        'resource_not_found',
        'Product not found',
        ctx.requestId
      )
    }

    decryptModelFields(product, [...ENCRYPTED_FIELDS.product], dek)
    return apiResponse.ok(ctx.response, apiProductTransformer.transform(product))
  }
}
