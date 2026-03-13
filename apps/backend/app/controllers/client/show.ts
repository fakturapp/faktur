import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client/client'

export default class Show {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const client = await Client.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .first()

    if (!client) {
      return response.notFound({ message: 'Client not found' })
    }

    return response.ok({
      client: {
        id: client.id,
        type: client.type,
        companyName: client.companyName,
        firstName: client.firstName,
        lastName: client.lastName,
        siren: client.siren,
        siret: client.siret,
        vatNumber: client.vatNumber,
        email: client.email,
        phone: client.phone,
        includeInEmails: client.includeInEmails,
        address: client.address,
        addressComplement: client.addressComplement,
        postalCode: client.postalCode,
        city: client.city,
        country: client.country,
        notes: client.notes,
        invoiceCount: 0,
        quoteCount: 0,
        totalRevenue: 0,
        createdAt: client.createdAt.toISO(),
      },
    })
  }
}
