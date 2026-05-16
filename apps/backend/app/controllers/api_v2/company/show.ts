import type { HttpContext } from '@adonisjs/core/http'
import Company from '#models/team/company'
import {
  decryptModelFields,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'
import apiResponse from '#services/api/api_response'
import apiCompanyTransformer from '#transformers/api_v2/api_company_transformer'

export default class Show {
  async handle(ctx: HttpContext) {
    const team = ctx.team!
    const dek = ctx.dek!

    const company = await Company.query().where('team_id', team.id).first()
    if (!company) {
      return apiResponse.notFound(
        ctx.response,
        'resource_not_found',
        'Company profile not configured for this team',
        ctx.requestId
      )
    }
    decryptModelFields(company, [...ENCRYPTED_FIELDS.company], dek)
    return apiResponse.ok(ctx.response, apiCompanyTransformer.transform(company))
  }
}
