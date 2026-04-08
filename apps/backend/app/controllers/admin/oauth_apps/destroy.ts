import type { HttpContext } from '@adonisjs/core/http'
import OauthApp from '#models/oauth/oauth_app'

export default class DestroyOauthApp {
  async handle({ params, response }: HttpContext) {
    const app = await OauthApp.find(params.id)
    if (!app) {
      return response.notFound({ message: 'OAuth app not found' })
    }

    await app.delete()

    return response.ok({ message: 'OAuth app deleted' })
  }
}
