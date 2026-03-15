import type { HttpContext } from '@adonisjs/core/http'
import Company from '#models/team/company'
import { updateBankValidator } from '#validators/auth/onboarding_validators'

export default class Bank {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const company = await Company.findBy('teamId', user.currentTeamId)

    if (!company) {
      return response.notFound({ message: 'No company found' })
    }

    const payload = await request.validateUsing(updateBankValidator)

    if (payload.iban !== undefined) company.iban = payload.iban
    if (payload.bic !== undefined) company.bic = payload.bic
    if (payload.bankName !== undefined) company.bankName = payload.bankName

    await company.save()

    return response.ok({
      message: 'Bank details updated successfully',
      company: {
        iban: company.iban,
        bic: company.bic,
        bankName: company.bankName,
      },
    })
  }
}
