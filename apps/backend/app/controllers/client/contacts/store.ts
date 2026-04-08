import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Client from '#models/client/client'
import ClientContact from '#models/client/client_contact'
import { encryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'

const storeContactValidator = vine.compile(
  vine.object({
    firstName: vine.string().trim().optional(),
    lastName: vine.string().trim().optional(),
    email: vine.string().trim().email().optional(),
    phone: vine.string().trim().optional(),
    role: vine.string().trim().optional(),
    notes: vine.string().trim().optional(),
    isPrimary: vine.boolean().optional(),
    includeInEmails: vine.boolean().optional(),
  })
)

export default class Store {
  async handle(ctx: HttpContext) {
    const { auth, params, request, response } = ctx
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

    const payload = await request.validateUsing(storeContactValidator)

    if (payload.isPrimary) {
      await ClientContact.query()
        .where('client_id', params.clientId)
        .where('team_id', teamId)
        .where('is_primary', true)
        .update({ isPrimary: false })
    }

    const contactData: Record<string, any> = {
      clientId: params.clientId,
      teamId,
      firstName: payload.firstName || null,
      lastName: payload.lastName || null,
      email: payload.email || null,
      phone: payload.phone || null,
      role: payload.role || null,
      notes: payload.notes || null,
      isPrimary: payload.isPrimary ?? false,
      includeInEmails: payload.includeInEmails ?? false,
    }

    encryptModelFields(contactData, [...ENCRYPTED_FIELDS.clientContact], dek)

    const contact = await ClientContact.create(contactData)

    return response.created({
      message: 'Contact created',
      contact: { id: contact.id },
    })
  }
}
