import type { HttpContext } from '@adonisjs/core/http'
import Company from '#models/team/company'
import { updateCompanyValidator } from '#validators/auth/onboarding_validators'
import {
  encryptModelFields,
  decryptModelFields,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'

export default class Update {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const dek: Buffer = (ctx as any).dek

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const company = await Company.findBy('teamId', user.currentTeamId)

    if (!company) {
      return response.notFound({ message: 'No company found. Create one first.' })
    }

    const payload = await request.validateUsing(updateCompanyValidator)

    const data: Record<string, any> = { ...payload }
    encryptModelFields(data, [...ENCRYPTED_FIELDS.company], dek)

    company.merge(data as Partial<typeof company>)
    await company.save()

    decryptModelFields(company, [...ENCRYPTED_FIELDS.company], dek)

    return response.ok({
      message: 'Company updated successfully',
      company,
    })
  }
}
