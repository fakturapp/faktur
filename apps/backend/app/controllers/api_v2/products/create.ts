import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product/product'
import {
  decryptModelFields,
  encryptModelFields,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'
import apiResponse from '#services/api/api_response'
import apiProductTransformer from '#transformers/api_v2/api_product_transformer'
import webhookEmitter from '#services/api/webhook_event_emitter'
import { createProductValidator } from '#validators/api_v2/product_validators'

export default class Create {
  async handle(ctx: HttpContext) {
    const team = ctx.team!
    const dek = ctx.dek!
    const payload = await createProductValidator.validate(ctx.request.body())

    const data: Record<string, any> = {
      teamId: team.id,
      name: payload.name,
      description: payload.description ?? null,
      unitPrice: payload.unit_price_cents / 100,
      vatRate: payload.vat_rate ?? '20',
      unit: payload.unit ?? null,
      saleType: payload.sale_type ?? null,
      reference: payload.reference ?? null,
      isArchived: payload.is_archived ?? false,
    }
    encryptModelFields(data, [...ENCRYPTED_FIELDS.product], dek)

    const product = await Product.create(data)
    decryptModelFields(product, [...ENCRYPTED_FIELDS.product], dek)
    const shape = apiProductTransformer.transform(product)

    webhookEmitter
      .emit({ type: 'product.created', teamId: team.id, data: { product: shape } })
      .catch(() => {})

    return apiResponse.created(ctx.response, shape)
  }
}
