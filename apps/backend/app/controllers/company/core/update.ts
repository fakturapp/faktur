import type { HttpContext } from '@adonisjs/core/http'
import Company from '#models/team/company'
import { updateCompanyValidator } from '#validators/auth/onboarding_validators'

export default class Update {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const company = await Company.findBy('teamId', user.currentTeamId)

    if (!company) {
      return response.notFound({ message: 'No company found. Create one first.' })
    }

    const payload = await request.validateUsing(updateCompanyValidator)

    company.merge(payload as Partial<typeof company>)
    await company.save()

    return response.ok({
      message: 'Company updated successfully',
      company,
    })
  }
}
