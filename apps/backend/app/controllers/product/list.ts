import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product/product'
import { decryptModelFieldsArray, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'
import ProductTransformer from '#transformers/product_transformer'

export default class List {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const showArchived = request.input('archived') === 'true'

    const query = Product.query().where('team_id', teamId).orderBy('created_at', 'desc')

    if (!showArchived) {
      query.where('is_archived', false)
    }

    const products = await query

    decryptModelFieldsArray(products, [...ENCRYPTED_FIELDS.product], dek)

    return response.ok({
      products: await ctx.serialize.withoutWrapping(ProductTransformer.transform(products)),
    })
  }
}
