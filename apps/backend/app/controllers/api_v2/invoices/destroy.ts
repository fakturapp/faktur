import type { HttpContext } from '@adonisjs/core/http'
import Invoice from '#models/invoice/invoice'
import apiResponse from '#services/api/api_response'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'
import webhookEmitter from '#services/api/webhook_event_emitter'

export default class Destroy {
  async handle(ctx: HttpContext) {
    const team = ctx.team!

    let internalId: string
    try {
      internalId = publicIdCodec.decode('invoice', ctx.params.id)
    } catch (err) {
      if (err instanceof PublicIdParseError) {
        return apiResponse.notFound(
          ctx.response,
          'resource_not_found',
          'Invoice not found',
          ctx.requestId
        )
      }
      throw err
    }

    const invoice = await Invoice.query()
      .where('id', internalId)
      .where('team_id', team.id)
      .first()
    if (!invoice) {
      return apiResponse.notFound(
        ctx.response,
        'resource_not_found',
        'Invoice not found',
        ctx.requestId
      )
    }

    if (invoice.status !== 'draft') {
      return apiResponse.unprocessable(
        ctx.response,
        'business_rule_violation',
        'Only draft invoices can be deleted',
        [{ field: 'status', code: 'invalid_state', message: `current: ${invoice.status}` }],
        ctx.requestId
      )
    }

    const publicId = publicIdCodec.encode('invoice', invoice.id)
    await invoice.delete()

    webhookEmitter
      .emit({ type: 'invoice.deleted', teamId: team.id, data: { id: publicId } })
      .catch(() => {})

    return apiResponse.noContent(ctx.response)
  }
}
