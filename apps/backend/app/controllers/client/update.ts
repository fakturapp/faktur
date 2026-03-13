import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client/client'

export default class Update {
  async handle({ auth, params, request, response }: HttpContext) {
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

    const data = request.only([
      'companyName',
      'firstName',
      'lastName',
      'siren',
      'siret',
      'vatNumber',
      'email',
      'phone',
      'includeInEmails',
      'address',
      'addressComplement',
      'postalCode',
      'city',
      'country',
      'notes',
    ])

    client.merge(data)
    await client.save()

    return response.ok({ message: 'Client updated' })
  }
}
