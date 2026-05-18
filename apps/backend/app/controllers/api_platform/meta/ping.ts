import type { HttpContext } from '@adonisjs/core/http'
import apiResponse from '#services/api/api_response'
import publicIdCodec from '#services/api/public_id_codec'

export default class Ping {
  async handle(ctx: HttpContext) {
    const apiKey = ctx.apiKey!
    const team = ctx.team!
    return apiResponse.ok(ctx.response, {
      api_version: 'platform',
      authenticated: true,
      team: {
        id: publicIdCodec.encode('team', team.id),
        name: team.name,
        encryption_mode: team.encryptionMode,
      },
      api_key: {
        id: publicIdCodec.encode('api_key', apiKey.id),
        name: apiKey.name,
        scopes: apiKey.scopes,
        rate_limit_tier: apiKey.rateLimitTier,
      },
      timestamp: new Date().toISOString(),
    })
  }
}
