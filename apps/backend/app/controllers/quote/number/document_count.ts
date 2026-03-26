import type { HttpContext } from '@adonisjs/core/http'
import Quote from '#models/quote/quote'

export default class DocumentCount {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const result = await Quote.query().where('team_id', teamId).count('* as cnt').first()

    const count = Number(result?.$extras.cnt ?? 0)

    return response.ok({ count })
  }
}
