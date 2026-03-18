import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client/client'
import {
  decryptModelFieldsArray,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'

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

    const clientsList = clients.map((c) => ({
      id: c.id,
      type: c.type,
      displayName: c.displayName,
      companyName: c.companyName,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      address: c.address,
      addressComplement: c.addressComplement,
      postalCode: c.postalCode,
      city: c.city,
      country: c.country,
      siren: c.siren,
      vatNumber: c.vatNumber,
      invoiceCount: 0,
      totalRevenue: 0,
      createdAt: c.createdAt.toISO(),
    }))

    return response.ok({ clients: clientsList })
  }
}
