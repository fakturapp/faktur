import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product/product'
import apiResponse from '#services/api/api_response'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'
import webhookEmitter from '#services/api/webhook_event_emitter'

export default class Destroy {
  async handle(ctx: HttpContext) {
    const team = ctx.team!

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

    const publicId = publicIdCodec.encode('product', product.id)
    await product.delete()

    webhookEmitter
      .emit({ type: 'product.deleted', teamId: team.id, data: { id: publicId } })
      .catch(() => {})

    return apiResponse.noContent(ctx.response)
  }
}
