import type { HttpContext } from '@adonisjs/core/http'
import OauthApp from '#models/oauth/oauth_app'
import type { OauthAppKind } from '#services/oauth/oauth_app_service'
import { updateOauthAppValidator } from '#validators/oauth_validator'

export default class UpdateOauthApp {
  async handle({ params, request, response }: HttpContext) {
    const app = await OauthApp.find(params.id)
    if (!app) {
      return response.notFound({ message: 'OAuth app not found' })
    }

    const payload = await request.validateUsing(updateOauthAppValidator)

    if (payload.name !== undefined) app.name = payload.name
    if (payload.description !== undefined) app.description = payload.description
    if (payload.iconUrl !== undefined) app.iconUrl = payload.iconUrl
    if (payload.websiteUrl !== undefined) app.websiteUrl = payload.websiteUrl
    if (payload.redirectUris !== undefined) app.redirectUris = payload.redirectUris
    if (payload.allowedOrigins !== undefined) app.allowedOrigins = payload.allowedOrigins
    if (payload.allowAllOrigins !== undefined) app.allowAllOrigins = payload.allowAllOrigins
    if (payload.scopes !== undefined) app.scopes = payload.scopes
    if (payload.webhookUrl !== undefined) app.webhookUrl = payload.webhookUrl
    if (payload.webhookEvents !== undefined) app.webhookEvents = payload.webhookEvents
    if (payload.kind !== undefined) app.kind = payload.kind as OauthAppKind
    if (payload.isActive !== undefined) app.isActive = payload.isActive

    await app.save()

    return response.ok({
      message: 'OAuth app updated',
      app: {
        id: app.id,
        name: app.name,
        description: app.description,
        iconUrl: app.iconUrl,
        websiteUrl: app.websiteUrl,
        clientId: app.clientId,
        redirectUris: app.redirectUris,
        allowedOrigins: app.allowedOrigins,
        allowAllOrigins: app.allowAllOrigins,
        scopes: app.scopes,
        webhookUrl: app.webhookUrl,
        webhookEvents: app.webhookEvents,
        kind: app.kind,
        isActive: app.isActive,
        isFirstParty: app.isFirstParty,
      },
    })
  }
}
