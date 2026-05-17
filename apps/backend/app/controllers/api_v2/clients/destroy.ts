import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client/client'
import apiResponse from '#services/api/api_response'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'
import webhookEmitter from '#services/api/webhook_event_emitter'

export default class Destroy {
  async handle(ctx: HttpContext) {
    const team = ctx.team!

    let internalId: string
    try {
      internalId = publicIdCodec.decode('client', ctx.params.id)
    } catch (err) {
      if (err instanceof PublicIdParseError) {
        return apiResponse.notFound(
          ctx.response,
          'resource_not_found',
          'Client not found',
          ctx.requestId
        )
      }
      throw err
    }

    const client = await Client.query().where('id', internalId).where('team_id', team.id).first()
    if (!client) {
      return apiResponse.notFound(
        ctx.response,
        'resource_not_found',
        'Client not found',
        ctx.requestId
      )
    }

    const publicId = publicIdCodec.encode('client', client.id)
    await client.delete()

    webhookEmitter
      .emit({
        type: 'client.deleted',
        teamId: team.id,
        data: { id: publicId },
      })
      .catch(() => {})

    return apiResponse.noContent(ctx.response)
  }
}
