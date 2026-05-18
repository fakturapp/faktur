import type { HttpContext } from '@adonisjs/core/http'
import apiResponse from '#services/api/api_response'
import apiCreditService from '#services/api/api_credit_service'

export default class Session {
  async handle(ctx: HttpContext) {
    const apiKey = ctx.apiKey!
    const usage = await apiCreditService.getUsage(apiKey.teamId)
    return apiResponse.ok(ctx.response, {
      session: usage.session,
      weekly: usage.weekly,
      per_minute: usage.per_minute,
      timestamp: new Date().toISOString(),
    })
  }
}
