import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client/client'

export default class Create {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const data = request.only([
      'type',
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

    const client = await Client.create({
      teamId,
      type: data.type || 'company',
      companyName: data.companyName || null,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      siren: data.siren || null,
      siret: data.siret || null,
      vatNumber: data.vatNumber || null,
      email: data.email || null,
      phone: data.phone || null,
      includeInEmails: data.includeInEmails ?? true,
      address: data.address || null,
      addressComplement: data.addressComplement || null,
      postalCode: data.postalCode || null,
      city: data.city || null,
      country: data.country || 'FR',
      notes: data.notes || null,
    })

    return response.created({
      message: 'Client created',
      client: {
        id: client.id,
        type: client.type,
        displayName: client.displayName,
      },
    })
  }
}
