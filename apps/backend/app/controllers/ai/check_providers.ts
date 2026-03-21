import type { HttpContext } from '@adonisjs/core/http'
import AiService from '#services/ai/ai_service'

export default class CheckProviders {
  async handle(ctx: HttpContext) {
    const { auth, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const ai = new AiService()

    if (!(await ai.isEnabled(teamId))) {
      return response.forbidden({ message: 'AI is not enabled.' })
    }

    const providers = await ai.getAvailableProviders(teamId, dek)

    return response.ok({ providers })
  }
}
