import type { HttpContext } from '@adonisjs/core/http'
import oauthAppService, { type OauthAppKind } from '#services/oauth/oauth_app_service'
import { createOauthAppValidator } from '#validators/oauth_validator'

export default class CreateOauthApp {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(createOauthAppValidator)

    const { app, clientSecret, webhookSecret } = await oauthAppService.create({
      name: payload.name,
      description: payload.description ?? null,
      iconUrl: payload.iconUrl ?? null,
      websiteUrl: payload.websiteUrl ?? null,
      redirectUris: payload.redirectUris,
      scopes: payload.scopes,
      webhookUrl: payload.webhookUrl ?? null,
      webhookEvents: payload.webhookEvents ?? null,
      kind: (payload.kind as OauthAppKind | undefined) ?? 'desktop',
      isFirstParty: payload.isFirstParty ?? false,
      createdByUserId: user.id,
    })

    return response.created({
      message: 'OAuth app created — copy the client_secret now, it will not be shown again.',
      app: {
        id: app.id,
        name: app.name,
        clientId: app.clientId,
        redirectUris: app.redirectUris,
        scopes: app.scopes,
        webhookUrl: app.webhookUrl,
        webhookEvents: app.webhookEvents,
        kind: app.kind,
        isActive: app.isActive,
      },
      clientSecret,
      webhookSecret,
    })
  }
}
