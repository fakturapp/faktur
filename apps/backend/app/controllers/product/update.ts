import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product/product'
import { updateProductValidator } from '#validators/product_validator'
import { encryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'

export default class Update {
  async handle(ctx: HttpContext) {
    const { auth, params, request, response } = ctx
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

    const data = await request.validateUsing(updateProductValidator)

    const updateData: Record<string, any> = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice
    if (data.vatRate !== undefined) updateData.vatRate = data.vatRate
    if (data.unit !== undefined) updateData.unit = data.unit
    if (data.saleType !== undefined) updateData.saleType = data.saleType
    if (data.reference !== undefined) updateData.reference = data.reference
    if (data.isArchived !== undefined) updateData.isArchived = data.isArchived

    encryptModelFields(updateData, [...ENCRYPTED_FIELDS.product], dek)

    product.merge(updateData)
    await product.save()

    return response.ok({ message: 'Product updated' })
  }
}
