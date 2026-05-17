import type { HttpContext } from '@adonisjs/core/http'
import CreditNote from '#models/credit_note/credit_note'
import { decryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'
import apiResponse from '#services/api/api_response'
import apiCreditNoteTransformer from '#transformers/api_v2/api_credit_note_transformer'
import publicIdCodec, { PublicIdParseError } from '#services/api/public_id_codec'

export default class Show {
  async handle(ctx: HttpContext) {
    const team = ctx.team!
    const dek = ctx.dek!

    let internalId: string
    try {
      internalId = publicIdCodec.decode('credit_note', ctx.params.id)
    } catch (err) {
      if (err instanceof PublicIdParseError) {
        return apiResponse.notFound(
          ctx.response,
          'resource_not_found',
          'Credit note not found',
          ctx.requestId
        )
      }
      throw err
    }

    const cn = await CreditNote.query().where('id', internalId).where('team_id', team.id).first()
    if (!cn) {
      return apiResponse.notFound(
        ctx.response,
        'resource_not_found',
        'Credit note not found',
        ctx.requestId
      )
    }
    decryptModelFields(cn, [...ENCRYPTED_FIELDS.creditNote], dek)
    return apiResponse.ok(ctx.response, apiCreditNoteTransformer.transform(cn))
  }
}
