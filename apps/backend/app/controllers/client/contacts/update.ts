import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import ClientContact from '#models/client/client_contact'
import { encryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'

const updateContactValidator = vine.compile(
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

export default class Update {
  async handle(ctx: HttpContext) {
    const { auth, params, request, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const contact = await ClientContact.query()
      .where('id', params.id)
      .where('client_id', params.clientId)
      .where('team_id', teamId)
      .first()

    if (!contact) {
      return response.notFound({ message: 'Contact not found' })
    }

    const payload = await request.validateUsing(updateContactValidator)

    if (payload.isPrimary) {
      await ClientContact.query()
        .where('client_id', params.clientId)
        .where('team_id', teamId)
        .where('is_primary', true)
        .whereNot('id', params.id)
        .update({ isPrimary: false })
    }

    const updateData: Record<string, any> = {}
    if (payload.firstName !== undefined) updateData.firstName = payload.firstName || null
    if (payload.lastName !== undefined) updateData.lastName = payload.lastName || null
    if (payload.email !== undefined) updateData.email = payload.email || null
    if (payload.phone !== undefined) updateData.phone = payload.phone || null
    if (payload.role !== undefined) updateData.role = payload.role || null
    if (payload.notes !== undefined) updateData.notes = payload.notes || null
    if (payload.isPrimary !== undefined) updateData.isPrimary = payload.isPrimary
    if (payload.includeInEmails !== undefined) updateData.includeInEmails = payload.includeInEmails

    encryptModelFields(updateData, [...ENCRYPTED_FIELDS.clientContact], dek)

    contact.merge(updateData)
    await contact.save()

    return response.ok({
      message: 'Contact updated',
      contact: { id: contact.id },
    })
  }
}
