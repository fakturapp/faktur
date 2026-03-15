import type { HttpContext } from '@adonisjs/core/http'
import Invoice from '#models/invoice/invoice'

export default class DocumentCount {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const result = await Invoice.query()
      .where('team_id', teamId)
      .count('* as total')
      .first()

    const count = Number(result?.$extras.total ?? 0)

    return response.ok({ count })
  }
}
