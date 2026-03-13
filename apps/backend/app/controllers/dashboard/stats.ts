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

    // Generate empty chart data for the last 90 days
    const chartData: { date: string; factures: number; devis: number }[] = []
    const now = new Date()
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      chartData.push({
        date: d.toISOString().split('T')[0],
        factures: 0,
        devis: 0,
      })
    }

    return response.ok({
      stats: {
        revenue: { value: 0, trend: 0 },
        invoices: { value: 0, trend: 0 },
        quotes: { value: 0, trend: 0 },
        clients: { value: clientsCount, trend: 0 },
      },
      recent: [],
      chartData,
    })
  }
}
