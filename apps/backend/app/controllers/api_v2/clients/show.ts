import type { HttpContext } from '@adonisjs/core/http'
import Client from '#models/client/client'
import { decryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'
import apiResponse from '#services/api/api_response'
import apiClientTransformer from '#transformers/api_v2/api_client_transformer'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'

export default class Show {
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
    return apiResponse.ok(ctx.response, apiClientTransformer.transform(client))
  }
}
