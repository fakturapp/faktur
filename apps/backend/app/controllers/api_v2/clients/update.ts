import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client/client'
import {
  decryptModelFields,
  encryptModelFields,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'
import apiResponse from '#services/api/api_response'
import apiClientTransformer from '#transformers/api_v2/api_client_transformer'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'
import webhookEmitter from '#services/api/webhook_event_emitter'
import { updateClientValidator } from '#validators/api_v2/client_validators'

export default class Update {
  async handle(ctx: HttpContext) {
    const team = ctx.team!
    const dek = ctx.dek!

    let internalId: string
    try {
      internalId = publicIdCodec.decode('client', ctx.params.id)
    } catch (err) {
      if (err instanceof PublicIdParseError) {
        return apiResponse.notFound(
          ctx.response,
          'resource_not_found',
          'Client not found',
          ctx.requestId
        )
      }
      throw err
    }

    const client = await Client.query()
      .where('id', internalId)
      .where('team_id', team.id)
      .first()
    if (!client) {
      return apiResponse.notFound(
        ctx.response,
        'resource_not_found',
        'Client not found',
        ctx.requestId
      )
    }

    decryptModelFields(client, [...ENCRYPTED_FIELDS.client], dek)
    const previous = apiClientTransformer.transform(client)

    const payload = await updateClientValidator.validate(ctx.request.body())
    const updates: Record<string, any> = {}
    if ('type' in payload) updates.type = payload.type
    if ('civility' in payload) updates.civility = payload.civility ?? null
    if ('company_name' in payload) updates.companyName = payload.company_name ?? null
    if ('first_name' in payload) updates.firstName = payload.first_name ?? null
    if ('last_name' in payload) updates.lastName = payload.last_name ?? null
    if ('email' in payload) updates.email = payload.email ?? null
    if ('phone' in payload) updates.phone = payload.phone ?? null
    if ('siren' in payload) updates.siren = payload.siren ?? null
    if ('siret' in payload) updates.siret = payload.siret ?? null
    if ('vat_number' in payload) updates.vatNumber = payload.vat_number ?? null
    if ('address' in payload) updates.address = payload.address ?? null
    if ('address_complement' in payload)
      updates.addressComplement = payload.address_complement ?? null
    if ('postal_code' in payload) updates.postalCode = payload.postal_code ?? null
    if ('city' in payload) updates.city = payload.city ?? null
    if ('country' in payload) updates.country = payload.country ?? 'FR'
    if ('include_in_emails' in payload) updates.includeInEmails = payload.include_in_emails ?? true
    if ('notes' in payload) updates.notes = payload.notes ?? null

    encryptModelFields(updates, [...ENCRYPTED_FIELDS.client], dek)
    client.merge(updates)
    await client.save()

    decryptModelFields(client, [...ENCRYPTED_FIELDS.client], dek)
    const shape = apiClientTransformer.transform(client)

    webhookEmitter
      .emit({
        type: 'client.updated',
        teamId: team.id,
        data: { client: shape },
        previousData: { client: previous },
      })
      .catch(() => {})

    return apiResponse.ok(ctx.response, shape)
  }
}
