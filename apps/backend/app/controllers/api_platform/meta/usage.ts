import type { HttpContext } from '@adonisjs/core/http'
import apiResponse from '#services/api/api_response'
import apiCreditService, { CREDIT_LIMITS } from '#services/api/api_credit_service'
import publicIdCodec from '#services/api/public_id_codec'

export default class Usage {
  async handle(ctx: HttpContext) {
    const apiKey = ctx.apiKey!
    const team = ctx.team!
    const usage = await apiCreditService.getUsage(apiKey.teamId)

    return apiResponse.ok(ctx.response, {
      team: {
        id: publicIdCodec.encode('team', team.id),
        name: team.name,
      },
      api_key: {
        id: publicIdCodec.encode('api_key', apiKey.id),
        name: apiKey.name,
      },
      limits: {
        per_minute: CREDIT_LIMITS.PER_MINUTE,
        per_session: CREDIT_LIMITS.PER_SESSION,
        session_hours: CREDIT_LIMITS.SESSION_HOURS,
        per_week: CREDIT_LIMITS.PER_WEEK,
        weekly_days: CREDIT_LIMITS.WEEKLY_DAYS,
      },
      session: usage.session,
      weekly: usage.weekly,
      per_minute: usage.per_minute,
      timestamp: new Date().toISOString(),
    })
  }
}
