import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product/product'
import { decryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'

export default class Show {
  async handle(ctx: HttpContext) {
    const { auth, params, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const product = await Product.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .first()

    if (!product) {
      return response.notFound({ message: 'Product not found' })
    }

    decryptModelFields(product, [...ENCRYPTED_FIELDS.product], dek)

    return response.ok({
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        unitPrice: product.unitPrice,
        vatRate: product.vatRate,
        unit: product.unit,
        saleType: product.saleType,
        reference: product.reference,
        isArchived: product.isArchived,
        createdAt: product.createdAt.toISO(),
      },
    })
  }
}
