import type { HttpContext } from '@adonisjs/core/http'
import oauthAppService from '#services/oauth/oauth_app_service'
import oauthTokenService from '#services/oauth/oauth_token_service'
import oauthWebhookService from '#services/oauth/oauth_webhook_service'
import { revokeRequestValidator } from '#validators/oauth_validator'
import { OAUTH_ERRORS } from '#services/oauth/oauth_constants'

export default class Revoke {
  async handle({ request, response }: HttpContext) {
    const payload = await request.validateUsing(revokeRequestValidator)

    const app = await oauthAppService.authenticateClient(payload.client_id, payload.client_secret)
    if (!app) {
      return response.unauthorized({
        error: OAUTH_ERRORS.invalid_client,
        error_description: 'Invalid client credentials',
      })
    }

    let token =
      payload.token_type_hint === 'refresh_token'
        ? await oauthTokenService.findActiveByRefreshToken(payload.token)
        : await oauthTokenService.findActiveByAccessToken(payload.token)

    if (!token) {
      token =
        payload.token_type_hint === 'refresh_token'
          ? await oauthTokenService.findActiveByAccessToken(payload.token)
          : await oauthTokenService.findActiveByRefreshToken(payload.token)
    }

    if (token && token.oauthAppId === app.id) {
      await oauthTokenService.revoke(token, 'client_revoked')
      await oauthWebhookService.enqueue(app, 'session.revoked', {
        user_id: token.userId,
        token_id: token.id,
        reason: 'client_revoked',
        ip: request.ip(),
      })
    }

    return response.ok({ revoked: true })
  }
}
