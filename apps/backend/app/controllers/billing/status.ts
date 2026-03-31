import type { HttpContext } from '@adonisjs/core/http'
import quotaService from '#services/billing/quota_service'

export default class Status {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    const plan = await quotaService.getUserPlan(user.id)
    return response.ok({ plan })
  }
}
