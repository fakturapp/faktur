import type { HttpContext } from '@adonisjs/core/http'
import OauthAuthorization from '#models/oauth/oauth_authorization'
import OauthToken from '#models/oauth/oauth_token'

/**
 * GET /api/v1/account/oauth-apps
 *
 * Lists every OAuth application the current user has ever authorized,
 * along with the active token sessions attached to each. Powers the
 * 'Mon compte → Applications connectées' screen.
 */
export default class ListUserOauthApps {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!

    const authorizations = await OauthAuthorization.query()
      .where('user_id', user.id)
      .preload('app')
      .orderBy('last_authorized_at', 'desc')

    if (authorizations.length === 0) {
      return response.ok({ apps: [] })
    }

    // One query to pull every active session for this user across all
    // apps — cheaper than N+1 per authorization row.
    const tokens = await OauthToken.query()
      .where('user_id', user.id)
      .whereNull('revoked_at')
      .where('refresh_expires_at', '>', new Date())
      .orderBy('last_used_at', 'desc')

    const tokensByApp = new Map<string, typeof tokens>()
    for (const token of tokens) {
      const bucket = tokensByApp.get(token.oauthAppId) ?? []
      bucket.push(token)
      tokensByApp.set(token.oauthAppId, bucket)
    }

    return response.ok({
      apps: authorizations.map((authz) => {
        const sessions = tokensByApp.get(authz.oauthAppId) ?? []
        return {
          authorizationId: authz.id,
          app: {
            id: authz.app.id,
            name: authz.app.name,
            description: authz.app.description,
            iconUrl: authz.app.iconUrl,
            websiteUrl: authz.app.websiteUrl,
            kind: authz.app.kind,
            isFirstParty: authz.app.isFirstParty,
          },
          scopes: authz.scopes,
          firstAuthorizedAt: authz.firstAuthorizedAt.toISO(),
          lastAuthorizedAt: authz.lastAuthorizedAt.toISO(),
          sessions: sessions.map((t) => ({
            id: t.id,
            deviceName: t.deviceName,
            devicePlatform: t.devicePlatform,
            deviceOs: t.deviceOs,
            lastIp: t.lastIp,
            lastUsedAt: t.lastUsedAt?.toISO() ?? null,
            createdAt: t.createdAt.toISO(),
          })),
        }
      }),
    })
  }
}
