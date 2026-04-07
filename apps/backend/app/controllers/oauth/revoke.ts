import type { HttpContext } from '@adonisjs/core/http'
import oauthAppService from '#services/oauth/oauth_app_service'
import oauthTokenService from '#services/oauth/oauth_token_service'
import oauthWebhookService from '#services/oauth/oauth_webhook_service'
import { revokeRequestValidator } from '#validators/oauth_validator'
import { OAUTH_ERRORS } from '#services/oauth/oauth_constants'

/**
 * OAuth2 token revocation endpoint — RFC 7009. Always responds 200
 * on a valid client authentication even if the supplied token is
 * unknown, as required by the spec (to prevent probing).
 */
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

    // Try both hint orderings.
    let token =
      payload.token_type_hint === 'refresh_token'
        ? await oauthTokenService.findActiveByRefreshToken(payload.token)
        : await oauthTokenService.findActiveByAccessToken(payload.token)

    if (!token) {
      // Try the other kind if the hint missed.
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

    // RFC 7009: always 200 regardless of outcome.
    return response.ok({ revoked: true })
  }
}
