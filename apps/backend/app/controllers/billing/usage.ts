import type { HttpContext } from '@adonisjs/core/http'
import quotaService from '#services/billing/quota_service'

export default class Usage {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    const data = await quotaService.getUsageStats(user.id)
    return response.ok(data)
  }
}
