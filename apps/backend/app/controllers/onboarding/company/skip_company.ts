import type { HttpContext } from '@adonisjs/core/http'

export default class SkipCompany {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.badRequest({ message: 'You must create a team first' })
    }

    return response.ok({ message: 'Company step skipped' })
  }
}
