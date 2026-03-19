import type { HttpContext } from '@adonisjs/core/http'
import AuthProvider from '#models/account/auth_provider'

export default class ListProviders {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!

    const providers = await AuthProvider.query()
      .where('userId', user.id)
      .orderBy('createdAt', 'asc')

    return response.ok({
      providers: providers.map((p) => ({
        id: p.id,
        provider: p.provider,
        email: p.email,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
        createdAt: p.createdAt,
      })),
    })
  }
}
