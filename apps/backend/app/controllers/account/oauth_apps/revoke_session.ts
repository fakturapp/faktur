import type { HttpContext } from '@adonisjs/core/http'
import OauthToken from '#models/oauth/oauth_token'
import OauthApp from '#models/oauth/oauth_app'
import oauthTokenService from '#services/oauth/oauth_token_service'
import oauthWebhookService from '#services/oauth/oauth_webhook_service'

/**
 * POST /api/v1/account/oauth-apps/sessions/:tokenId/revoke
 *
 * Revokes a single active session the current user owns. The caller
 * is the end user, not the admin, so we verify ownership before
 * touching anything.
 */
export default class RevokeUserOauthSession {
  async handle({ auth, params, request, response }: HttpContext) {
    const user = auth.user!

    const token = await OauthToken.query()
      .where('id', params.tokenId)
      .where('user_id', user.id)
      .first()

    if (!token) {
      return response.notFound({ message: 'Session not found' })
    }

    if (token.revokedAt) {
      return response.ok({ message: 'Session already revoked' })
    }

    await oauthTokenService.revoke(token, 'user_revoked')

    const app = await OauthApp.find(token.oauthAppId)
    if (app) {
      await oauthWebhookService.enqueue(app, 'session.revoked', {
        user_id: user.id,
        token_id: token.id,
        reason: 'user_revoked',
        device_name: token.deviceName,
        ip: request.ip(),
      })
    }

    return response.ok({ message: 'Session revoked' })
  }
}
