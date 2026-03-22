import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client/client'
import ClientContact from '#models/client/client_contact'
import { decryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'
import ClientContactTransformer from '#transformers/client_contact_transformer'

export default class Index {
  async handle(ctx: HttpContext) {
    const { auth, params, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const client = await Client.query()
      .where('id', params.clientId)
      .where('team_id', teamId)
      .first()

    if (!client) {
      return response.notFound({ message: 'Client not found' })
    }

    const contacts = await ClientContact.query()
      .where('client_id', params.clientId)
      .where('team_id', teamId)
      .orderBy('is_primary', 'desc')
      .orderBy('created_at', 'asc')

    for (const contact of contacts) {
      decryptModelFields(contact, [...ENCRYPTED_FIELDS.clientContact], dek)
    }

    return response.ok({
      contacts: await ctx.serialize.withoutWrapping(ClientContactTransformer.transform(contacts)),
    })
  }
}
