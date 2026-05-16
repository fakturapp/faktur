import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product/product'
import {
  decryptModelFields,
  encryptModelFields,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'
import apiResponse from '#services/api/api_response'
import apiProductTransformer from '#transformers/api_v2/api_product_transformer'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'
import webhookEmitter from '#services/api/webhook_event_emitter'
import { updateProductValidator } from '#validators/api_v2/product_validators'

export default class Update {
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

    const product = await Product.query()
      .where('id', internalId)
      .where('team_id', team.id)
      .first()
    if (!product) {
      return apiResponse.notFound(
        ctx.response,
        'resource_not_found',
        'Product not found',
        ctx.requestId
      )
    }

    decryptModelFields(product, [...ENCRYPTED_FIELDS.product], dek)
    const previous = apiProductTransformer.transform(product)

    const payload = await updateProductValidator.validate(ctx.request.body())
    const updates: Record<string, any> = {}
    if ('name' in payload && payload.name !== undefined) updates.name = payload.name
    if ('description' in payload) updates.description = payload.description ?? null
    if ('unit_price_cents' in payload && payload.unit_price_cents !== undefined)
      updates.unitPrice = payload.unit_price_cents / 100
    if ('vat_rate' in payload && payload.vat_rate !== undefined) updates.vatRate = payload.vat_rate
    if ('unit' in payload) updates.unit = payload.unit ?? null
    if ('sale_type' in payload) updates.saleType = payload.sale_type ?? null
    if ('reference' in payload) updates.reference = payload.reference ?? null
    if ('is_archived' in payload && payload.is_archived !== undefined)
      updates.isArchived = payload.is_archived

    encryptModelFields(updates, [...ENCRYPTED_FIELDS.product], dek)
    product.merge(updates)
    await product.save()

    decryptModelFields(product, [...ENCRYPTED_FIELDS.product], dek)
    const shape = apiProductTransformer.transform(product)

    webhookEmitter
      .emit({
        type: 'product.updated',
        teamId: team.id,
        data: { product: shape },
        previousData: { product: previous },
      })
      .catch(() => {})

    return apiResponse.ok(ctx.response, shape)
  }
}
