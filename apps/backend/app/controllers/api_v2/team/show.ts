import type { HttpContext } from '@adonisjs/core/http'
import apiResponse from '#services/api/api_response'
import publicIdCodec from '#services/api/public_id_codec'

export default class Show {
  async handle(ctx: HttpContext) {
    const team = ctx.team!
    return apiResponse.ok(ctx.response, {
      id: publicIdCodec.encode('team', team.id),
      name: team.name,
      icon_url: team.iconUrl,
      encryption_mode: team.encryptionMode,
      created_at: team.createdAt.toISO() ?? '',
    })
  }
}
