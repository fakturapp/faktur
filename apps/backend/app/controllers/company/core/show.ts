import type { HttpContext } from '@adonisjs/core/http'
import Company from '#models/team/company'
import { decryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'

export default class Show {
  async handle(ctx: HttpContext) {
    const { auth, response } = ctx
    const user = auth.user!
    const dek: Buffer = (ctx as any).dek

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const company = await Company.findBy('teamId', user.currentTeamId)

    if (!company) {
      return response.notFound({ message: 'No company found' })
    }

    decryptModelFields(company, [...ENCRYPTED_FIELDS.company], dek)

    return response.ok({ company })
  }
}
