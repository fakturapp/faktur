import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client/client'
import { decryptModelFieldsArray, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'
import ClientTransformer from '#transformers/client_transformer'

export default class List {
  async handle(ctx: HttpContext) {
    const { auth, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    // Search on encrypted fields is not possible server-side.
    // Load all team clients and filter client-side after decryption.
    const clients = await Client.query().where('team_id', teamId).orderBy('created_at', 'desc')

    decryptModelFieldsArray(clients, [...ENCRYPTED_FIELDS.client], dek)

    return response.ok({
      clients: await ctx.serialize.withoutWrapping(ClientTransformer.transform(clients)),
    })
  }
}
