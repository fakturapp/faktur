import type { HttpContext } from '@adonisjs/core/http'
import apiCreditService from '#services/api/api_credit_service'

export default class Usage {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId
    if (!teamId) return response.badRequest({ message: 'No team selected' })

    const usage = await apiCreditService.getUsage(teamId)
    return response.ok({ data: usage })
  }
}
