import type { HttpContext } from '@adonisjs/core/http'
import OauthApp from '#models/oauth/oauth_app'
import db from '@adonisjs/lucid/services/db'

export default class ListOauthApps {
  async handle({ response }: HttpContext) {
    const apps = await OauthApp.query().orderBy('created_at', 'desc')

    const counts = await db
      .from('oauth_tokens')
      .whereNull('revoked_at')
      .where('expires_at', '>', new Date())
      .groupBy('oauth_app_id')
      .select('oauth_app_id')
      .count('* as count')

    const countByApp = new Map<string, number>()
    for (const row of counts) {
      countByApp.set(row.oauth_app_id, Number(row.count))
    }

    return response.ok({
      apps: apps.map((app) => ({
        id: app.id,
        name: app.name,
        description: app.description,
        iconUrl: app.iconUrl,
        websiteUrl: app.websiteUrl,
        clientId: app.clientId,
        redirectUris: app.redirectUris,
        allowedOrigins: app.allowedOrigins ?? [],
        allowAllOrigins: app.allowAllOrigins ?? false,
        scopes: app.scopes,
        webhookUrl: app.webhookUrl,
        webhookEvents: app.webhookEvents,
        kind: app.kind,
        isActive: app.isActive,
        isFirstParty: app.isFirstParty,
        activeSessions: countByApp.get(app.id) ?? 0,
        createdAt: app.createdAt.toISO(),
      })),
    })
  }
}
