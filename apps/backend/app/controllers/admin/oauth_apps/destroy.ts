import type { HttpContext } from '@adonisjs/core/http'
import OauthApp from '#models/oauth/oauth_app'

export default class DestroyOauthApp {
  async handle({ params, response }: HttpContext) {
    const app = await OauthApp.find(params.id)
    if (!app) {
      return response.notFound({ message: 'OAuth app not found' })
    }

    // Hard delete cascades through tokens, codes, authorizations and
    // webhook deliveries thanks to ON DELETE CASCADE at the SQL level.
    await app.delete()

    return response.ok({ message: 'OAuth app deleted' })
  }
}
