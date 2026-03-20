import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product/product'
import { createProductValidator } from '#validators/product_validator'
import {
  encryptModelFields,
  decryptModelFields,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'

export default class Create {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const data = await request.validateUsing(createProductValidator)

    const productData: Record<string, any> = {
      teamId,
      name: data.name,
      description: data.description || null,
      unitPrice: data.unitPrice,
      vatRate: data.vatRate || '20',
      unit: data.unit || null,
      saleType: data.saleType || null,
      reference: data.reference || null,
      isArchived: false,
    }

    encryptModelFields(productData, [...ENCRYPTED_FIELDS.product], dek)

    const product = await Product.create(productData)

    decryptModelFields(product, [...ENCRYPTED_FIELDS.product], dek)

    return response.created({
      message: 'Product created',
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
