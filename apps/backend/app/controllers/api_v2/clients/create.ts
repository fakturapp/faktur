import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client/client'
import {
  encryptModelFields,
  decryptModelFields,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'
import apiResponse from '#services/api/api_response'
import apiClientTransformer from '#transformers/api_v2/api_client_transformer'
import webhookEmitter from '#services/api/webhook_event_emitter'
import { createClientValidator } from '#validators/api_v2/client_validators'

export default class Create {
  async handle(ctx: HttpContext) {
    const team = ctx.team!
    const dek = ctx.dek!
    const payload = await createClientValidator.validate(ctx.request.body())

    const clientData: Record<string, any> = {
      teamId: team.id,
      type: payload.type ?? 'company',
      civility: payload.civility ?? null,
      companyName: payload.company_name ?? null,
      firstName: payload.first_name ?? null,
      lastName: payload.last_name ?? null,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      siren: payload.siren ?? null,
      siret: payload.siret ?? null,
      vatNumber: payload.vat_number ?? null,
      address: payload.address ?? null,
      addressComplement: payload.address_complement ?? null,
      postalCode: payload.postal_code ?? null,
      city: payload.city ?? null,
      country: payload.country ?? 'FR',
      notes: payload.notes ?? null,
      includeInEmails: payload.include_in_emails ?? true,
    }
    encryptModelFields(clientData, [...ENCRYPTED_FIELDS.client], dek)

    const client = await Client.create(clientData)
    decryptModelFields(client, [...ENCRYPTED_FIELDS.client], dek)
    const shape = apiClientTransformer.transform(client)

    webhookEmitter
      .emit({ type: 'client.created', teamId: team.id, data: { client: shape } })
      .catch(() => {})

    return apiResponse.created(ctx.response, shape)
  }
}
