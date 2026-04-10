import type { HttpContext } from '@adonisjs/core/http'
import AiService from '#services/ai/ai_service'

export default class CheckProviders {
  async handle(ctx: HttpContext) {
    const { auth, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    if (!(await AiService.isEnabled(teamId))) {
      return response.forbidden({ message: 'AI is not enabled.' })
    }

    return response.ok({
      providers: [{ provider: 'gemini', available: true, source: 'server' }],
    })
  }
}
