import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client/client'

export default class List {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const search = request.input('search', '')

    const query = Client.query().where('team_id', teamId).orderBy('created_at', 'desc')

    if (search) {
      query.where((q) => {
        q.whereILike('company_name', `%${search}%`)
          .orWhereILike('first_name', `%${search}%`)
          .orWhereILike('last_name', `%${search}%`)
          .orWhereILike('email', `%${search}%`)
      })
    }

    const clients = await query

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
