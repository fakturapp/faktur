import type { HttpContext } from '@adonisjs/core/http'
import OauthApp from '#models/oauth/oauth_app'
import OauthAuthorization from '#models/oauth/oauth_authorization'
import oauthCodeService from '#services/oauth/oauth_code_service'
import oauthWebhookService from '#services/oauth/oauth_webhook_service'
import keyStoreWarmer from '#services/crypto/key_store_warmer'
import { authorizeRequestValidator, consentSubmitValidator } from '#validators/oauth_validator'
import { OAUTH_ERRORS } from '#services/oauth/oauth_constants'
import { DateTime } from 'luxon'

/**
 * OAuth2 authorization endpoint.
 *
 * GET /oauth/authorize - returns the consent metadata for the front-end
 * to render the consent screen. The frontend itself owns the UI — this
 * controller only validates the query string, checks the client exists,
 * and produces the data bag.
 *
 * POST /oauth/authorize/consent - records the user's decision. On
 * 'allow', mints an authorization code bound to the user + app and
 * tells the caller where to redirect. On 'deny', returns an
 * access_denied error redirect.
 */
export default class Authorize {
  /**
   * GET /oauth/authorize
   * Returns a JSON bag with the metadata the consent screen needs.
   */
  async show({ auth, request, response }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({
        error: OAUTH_ERRORS.access_denied,
        error_description: 'User must be authenticated',
      })
    }

    const payload = await request.validateUsing(authorizeRequestValidator)

    if (payload.response_type !== 'code') {
      return response.badRequest({
        error: OAUTH_ERRORS.unsupported_grant_type,
        error_description: 'Only response_type=code is supported',
      })
    }

    // PKCE is mandatory for desktop clients — reject anything weaker.
    if (payload.code_challenge && payload.code_challenge_method !== 'S256') {
      return response.badRequest({
        error: OAUTH_ERRORS.invalid_request,
        error_description: 'Only code_challenge_method=S256 is supported',
      })
    }

    const app = await OauthApp.query()
      .where('client_id', payload.client_id)
      .where('is_active', true)
      .first()

    if (!app) {
      return response.notFound({
        error: OAUTH_ERRORS.invalid_client,
        error_description: 'Unknown client_id',
      })
    }

    if (!this.isRedirectUriAllowed(app, payload.redirect_uri)) {
      return response.badRequest({
        error: OAUTH_ERRORS.invalid_request,
        error_description: 'redirect_uri not in allow-list',
      })
    }

    // Scope intersection: the requested scopes must all be included in
    // the ones the app was granted at creation time.
    const requestedScopes = this.parseScopes(payload.scope)
    const invalidScopes = requestedScopes.filter((s) => !app.scopes.includes(s))
    if (invalidScopes.length > 0) {
      return response.badRequest({
        error: OAUTH_ERRORS.invalid_scope,
        error_description: `Scopes not granted to this app: ${invalidScopes.join(', ')}`,
      })
    }

    // Silent re-auth: if the user has already consented to these exact
    // scopes, we tell the front-end to skip the screen by setting
    // `autoApprove: true`. The actual auto-issuing happens via
    // /consent on the next round trip.
    const existing = await OauthAuthorization.query()
      .where('user_id', user.id)
      .where('oauth_app_id', app.id)
      .first()

    const autoApprove =
      existing !== null && requestedScopes.every((s) => existing.scopes.includes(s))

    return response.ok({
      client: {
        id: app.id,
        clientId: app.clientId,
        name: app.name,
        description: app.description,
        iconUrl: app.iconUrl,
        websiteUrl: app.websiteUrl,
        isFirstParty: app.isFirstParty,
      },
      scopes: requestedScopes,
      redirectUri: payload.redirect_uri,
      state: payload.state ?? null,
      codeChallenge: payload.code_challenge ?? null,
      codeChallengeMethod: payload.code_challenge_method ?? null,
      autoApprove,
    })
  }

  /**
   * POST /oauth/authorize/consent
   * Final step of the consent screen — either mint a code or return a
   * deny redirect URL.
   *
   * Side effect: if the browser sent an `X-Vault-Key` header (the
   * sessionKey wrapping the user's KEK), we warm the in-memory key
   * store so the desktop app can immediately get a decrypted vault
   * when it calls /oauth/exchange-session moments later. This is
   * what makes 'connecter via Faktur Desktop' result in a fully
   * decrypted session without ever asking for a password.
   */
  async consent({ auth, request, response }: HttpContext) {
    const user = auth.user
    if (!user) {
      return response.unauthorized({
        error: OAUTH_ERRORS.access_denied,
        error_description: 'User must be authenticated',
      })
    }

    // Best-effort warm-up of the server-side keyStore. Failures are
    // silently ignored — the desktop will just end up with
    // vaultLocked=true if the browser didn't have a warm vault.
    const vaultKeyHeader = request.header('x-vault-key') || request.header('X-Vault-Key')
    const currentTokenId = (user as any).currentAccessToken?.identifier
    if (vaultKeyHeader && currentTokenId) {
      await keyStoreWarmer.warmFromRequest(
        user.id,
        user.currentTeamId ?? null,
        String(currentTokenId),
        String(vaultKeyHeader)
      )
    }

    const payload = await request.validateUsing(consentSubmitValidator)

    const app = await OauthApp.query()
      .where('client_id', payload.client_id)
      .where('is_active', true)
      .first()

    if (!app) {
      return response.notFound({
        error: OAUTH_ERRORS.invalid_client,
        error_description: 'Unknown client_id',
      })
    }

    if (!this.isRedirectUriAllowed(app, payload.redirect_uri)) {
      return response.badRequest({
        error: OAUTH_ERRORS.invalid_request,
        error_description: 'redirect_uri not in allow-list',
      })
    }

    const requestedScopes = this.parseScopes(payload.scope)
    const invalidScopes = requestedScopes.filter((s) => !app.scopes.includes(s))
    if (invalidScopes.length > 0) {
      return response.badRequest({
        error: OAUTH_ERRORS.invalid_scope,
        error_description: `Scopes not granted to this app: ${invalidScopes.join(', ')}`,
      })
    }

    // User said no — respond with a deny redirect the front-end will
    // follow to bounce back to the client app.
    if (payload.decision !== 'allow') {
      const denyUrl = this.buildErrorRedirect(
        payload.redirect_uri,
        OAUTH_ERRORS.access_denied,
        'The user denied the request',
        payload.state ?? null
      )
      return response.ok({ redirect: denyUrl })
    }

    // Upsert the user ↔ app authorization ledger.
    const now = DateTime.now()
    let authorization = await OauthAuthorization.query()
      .where('user_id', user.id)
      .where('oauth_app_id', app.id)
      .first()
    if (!authorization) {
      authorization = await OauthAuthorization.create({
        userId: user.id,
        oauthAppId: app.id,
        scopes: requestedScopes,
        firstAuthorizedAt: now,
        lastAuthorizedAt: now,
      })
    } else {
      authorization.scopes = Array.from(new Set([...authorization.scopes, ...requestedScopes]))
      authorization.lastAuthorizedAt = now
      await authorization.save()
    }

    // Mint a one-time authorization code.
    const { rawCode } = await oauthCodeService.issue({
      oauthAppId: app.id,
      userId: user.id,
      redirectUri: payload.redirect_uri,
      scopes: requestedScopes,
      codeChallenge: payload.code_challenge ?? null,
      codeChallengeMethod: payload.code_challenge_method ?? null,
      clientIp: request.ip(),
      userAgent: request.header('user-agent') ?? null,
    })

    // Emit a webhook so the app knows a fresh consent happened — useful
    // for analytics and the 'Authorized devices' ledger inside the app.
    await oauthWebhookService.enqueue(app, 'authorization.granted', {
      user_id: user.id,
      scopes: requestedScopes,
      ip: request.ip(),
    })

    const redirect = this.buildSuccessRedirect(payload.redirect_uri, rawCode, payload.state ?? null)
    return response.ok({ redirect })
  }

  /**
   * Loopback-aware redirect_uri matcher. Desktop clients use
   * http://127.0.0.1:<ephemeral>/callback — the port changes every time
   * the app is opened, so we compare scheme + host + path and allow the
   * port to float.
   */
  private isRedirectUriAllowed(app: OauthApp, presented: string): boolean {
    if (app.isRedirectUriAllowed(presented)) return true

    try {
      const p = new URL(presented)
      const isLoopback = p.hostname === '127.0.0.1' || p.hostname === 'localhost'
      if (!isLoopback) return false
      if (p.protocol !== 'http:') return false

      return app.redirectUris.some((raw) => {
        try {
          const allowed = new URL(raw)
          if (allowed.protocol !== 'http:') return false
          const allowedIsLoopback =
            allowed.hostname === '127.0.0.1' || allowed.hostname === 'localhost'
          if (!allowedIsLoopback) return false
          return allowed.pathname === p.pathname
        } catch {
          return false
        }
      })
    } catch {
      return false
    }
  }

  private parseScopes(raw: string | undefined | null): string[] {
    if (!raw) return ['profile']
    return raw
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }

  private buildSuccessRedirect(redirectUri: string, code: string, state: string | null): string {
    const url = new URL(redirectUri)
    url.searchParams.set('code', code)
    if (state) url.searchParams.set('state', state)
    return url.toString()
  }

  private buildErrorRedirect(
    redirectUri: string,
    error: string,
    description: string,
    state: string | null
  ): string {
    const url = new URL(redirectUri)
    url.searchParams.set('error', error)
    url.searchParams.set('error_description', description)
    if (state) url.searchParams.set('state', state)
    return url.toString()
  }
}
