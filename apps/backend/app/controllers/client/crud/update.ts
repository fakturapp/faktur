import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client/client'
import { encryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'

export default class Update {
  async handle(ctx: HttpContext) {
    const { auth, params, request, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const client = await Client.query().where('id', params.id).where('team_id', teamId).first()

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

    encryptModelFields(data, [...ENCRYPTED_FIELDS.client], dek)

    client.merge(data)
    await client.save()

    return response.ok({ message: 'Client updated' })
  }
}
