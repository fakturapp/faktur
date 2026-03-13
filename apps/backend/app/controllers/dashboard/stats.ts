import type { HttpContext } from '@adonisjs/core/http'

export default class Stats {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!

    return response.ok({
      stats: {
        revenue: 0,
        invoicesCount: 0,
        quotesCount: 0,
        clientsCount: 0,
      },
      recentActivity: [],
      user: {
        fullName: user.fullName,
        email: user.email,
      },
    })
  }
}
