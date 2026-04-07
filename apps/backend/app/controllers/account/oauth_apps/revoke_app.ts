import type { HttpContext } from '@adonisjs/core/http'
import OauthAuthorization from '#models/oauth/oauth_authorization'
import OauthApp from '#models/oauth/oauth_app'
import oauthTokenService from '#services/oauth/oauth_token_service'
import oauthWebhookService from '#services/oauth/oauth_webhook_service'

/**
 * POST /api/v1/account/oauth-apps/:authorizationId/revoke
 *
 * 'Disconnect this application' — kills every active session for the
 * current user ↔ app pair AND deletes the consent record so the next
 * authorize call re-prompts the consent screen.
 */
export default class RevokeUserOauthApp {
  async handle({ auth, params, request, response }: HttpContext) {
    const user = auth.user!

    const authorization = await OauthAuthorization.query()
      .where('id', params.authorizationId)
      .where('user_id', user.id)
      .first()

    if (!authorization) {
      return response.notFound({ message: 'Authorization not found' })
    }

    const revoked = await oauthTokenService.revokeAllForUserApp(
      user.id,
      authorization.oauthAppId,
      'user_revoked_app'
    )

    const app = await OauthApp.find(authorization.oauthAppId)
    if (app) {
      await oauthWebhookService.enqueue(app, 'authorization.revoked', {
        user_id: user.id,
        authorization_id: authorization.id,
        revoked_token_count: revoked,
        reason: 'user_revoked_app',
        ip: request.ip(),
      })
    }

    // Drop the consent ledger so the next /oauth/authorize call will
    // force a fresh consent screen rather than silently re-using the
    // previous grant.
    await authorization.delete()

    return response.ok({
      message: `Application revoked — ${revoked} session${revoked !== 1 ? 's' : ''} terminated`,
      revokedCount: revoked,
    })
  }
}
