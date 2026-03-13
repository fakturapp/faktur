import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client/client'

export default class Stats {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    let clientsCount = 0

    if (teamId) {
      clientsCount = await Client.query()
        .where('team_id', teamId)
        .count('* as total')
        .then((r) => Number(r[0].$extras.total))
    }

    return response.ok({
      stats: {
        revenue: { value: 0, trend: 0 },
        invoices: { value: 0, trend: 0 },
        quotes: { value: 0, trend: 0 },
        clients: { value: clientsCount, trend: 0 },
      },
      recent: [],
    })
  }
}
