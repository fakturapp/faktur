import type { HttpContext } from '@adonisjs/core/http'
import OauthApp from '#models/oauth/oauth_app'
import OauthToken from '#models/oauth/oauth_token'
import oauthTokenService from '#services/oauth/oauth_token_service'
import oauthWebhookService from '#services/oauth/oauth_webhook_service'
import { DateTime } from 'luxon'

export default class RevokeOauthAppSessions {
  async handle({ params, response }: HttpContext) {
    const app = await OauthApp.find(params.id)
    if (!app) {
      return response.notFound({ message: 'OAuth app not found' })
    }

    const tokens = await OauthToken.query().where('oauth_app_id', app.id).whereNull('revoked_at')

    let count = 0
    for (const token of tokens) {
      await oauthTokenService.revoke(token, 'admin_revoked')
      await oauthWebhookService.enqueue(app, 'session.revoked', {
        user_id: token.userId,
        token_id: token.id,
        reason: 'admin_revoked',
        revoked_at: DateTime.now().toISO(),
      })
      count += 1
    }

    return response.ok({
      message: `Revoked ${count} active session${count === 1 ? '' : 's'}`,
      revokedCount: count,
    })
  }
}
