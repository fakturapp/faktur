import type { HttpContext } from '@adonisjs/core/http'
import Expense from '#models/expense/expense'
import apiResponse from '#services/api/api_response'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'
import webhookEmitter from '#services/api/webhook_event_emitter'

export default class Destroy {
  async handle(ctx: HttpContext) {
    const team = ctx.team!

    let internalId: string
    try {
      internalId = publicIdCodec.decode('expense', ctx.params.id)
    } catch (err) {
      if (err instanceof PublicIdParseError) {
        return apiResponse.notFound(
          ctx.response,
          'resource_not_found',
          'Expense not found',
          ctx.requestId
        )
      }
      throw err
    }

    const expense = await Expense.query()
      .where('id', internalId)
      .where('team_id', team.id)
      .first()
    if (!expense) {
      return apiResponse.notFound(
        ctx.response,
        'resource_not_found',
        'Expense not found',
        ctx.requestId
      )
    }

    const publicId = publicIdCodec.encode('expense', expense.id)
    await expense.delete()

    webhookEmitter
      .emit({ type: 'expense.deleted', teamId: team.id, data: { id: publicId } })
      .catch(() => {})

    return apiResponse.noContent(ctx.response)
  }
}
