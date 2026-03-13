import type { HttpContext } from '@adonisjs/core/http'
import Company from '#models/team/company'

export default class Show {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const company = await Company.findBy('teamId', user.currentTeamId)

    if (!company) {
      return response.notFound({ message: 'No company found' })
    }

    return response.ok({ company })
  }
}
