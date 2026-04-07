import type { HttpContext } from '@adonisjs/core/http'
import OauthApp from '#models/oauth/oauth_app'
import oauthAppService from '#services/oauth/oauth_app_service'

/**
 * Admin — rotate the client_secret and/or webhook secret of an OAuth
 * app. The raw new values are returned ONCE in the response.
 */
export default class RotateOauthAppSecrets {
  async handle({ params, request, response }: HttpContext) {
    const app = await OauthApp.find(params.id)
    if (!app) {
      return response.notFound({ message: 'OAuth app not found' })
    }

    const body = request.body() as { client?: boolean; webhook?: boolean }
    const result: { clientSecret?: string; webhookSecret?: string } = {}

    if (body.client) {
      result.clientSecret = await oauthAppService.rotateClientSecret(app)
    }
    if (body.webhook) {
      if (!app.webhookUrl) {
        return response.badRequest({ message: 'App has no webhook configured' })
      }
      result.webhookSecret = await oauthAppService.rotateWebhookSecret(app)
    }

    return response.ok({
      message: 'Secrets rotated — copy them now, they will not be shown again.',
      ...result,
    })
  }
}
