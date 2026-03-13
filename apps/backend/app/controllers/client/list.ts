import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client/client'

export default class List {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const clients = await Client.query().where('team_id', teamId).orderBy('created_at', 'desc')

    const clientsList = clients.map((c) => ({
      id: c.id,
      type: c.type,
      displayName: c.displayName,
      companyName: c.companyName,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      city: c.city,
      country: c.country,
      invoiceCount: 0,
      totalRevenue: 0,
      createdAt: c.createdAt.toISO(),
    }))

    return response.ok({ clients: clientsList })
  }
}
