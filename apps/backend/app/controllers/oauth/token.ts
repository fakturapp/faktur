import type { HttpContext } from '@adonisjs/core/http'
import oauthAppService from '#services/oauth/oauth_app_service'
import oauthCodeService from '#services/oauth/oauth_code_service'
import oauthTokenService from '#services/oauth/oauth_token_service'
import oauthCrypto from '#services/oauth/oauth_crypto_service'
import oauthWebhookService from '#services/oauth/oauth_webhook_service'
import { tokenRequestValidator } from '#validators/oauth_validator'
import { OAUTH_ERRORS } from '#services/oauth/oauth_constants'

// ---------- OAuth2 token endpoint (RFC 6749 + RFC 7636) ----------
// Public clients (desktop, cli) authenticate via PKCE only; confidential
// clients (web) additionally require a client_secret.
export default class Token {
  async handle({ request, response }: HttpContext) {
    const payload = await request.validateUsing(tokenRequestValidator)

    const app = await oauthAppService.authenticateClient(
      payload.client_id,
      payload.client_secret ?? null
    )
    if (!app) {
      return response.unauthorized({
        error: OAUTH_ERRORS.invalid_client,
        error_description: 'Invalid client credentials',
      })
    }

    if (payload.grant_type === 'authorization_code') {
      return this.handleAuthorizationCode(payload, app, request, response)
    }
    if (payload.grant_type === 'refresh_token') {
      return this.handleRefreshToken(payload, app, request, response)
    }

    return response.badRequest({
      error: OAUTH_ERRORS.unsupported_grant_type,
      error_description: `grant_type '${payload.grant_type}' is not supported`,
    })
  }

  // ---------- authorization_code grant ----------
  private async handleAuthorizationCode(
    payload: any,
    app: any,
    request: any,
    response: any
  ) {
    if (!payload.code || !payload.redirect_uri) {
      return response.badRequest({
        error: OAUTH_ERRORS.invalid_request,
        error_description: 'code and redirect_uri are required for authorization_code grant',
      })
    }

    const code = await oauthCodeService.redeem(payload.code)
    if (!code) {
      return response.badRequest({
        error: OAUTH_ERRORS.invalid_grant,
        error_description: 'Authorization code is invalid, expired or already used',
      })
    }

    if (code.redirectUri !== payload.redirect_uri) {
      return response.badRequest({
        error: OAUTH_ERRORS.invalid_grant,
        error_description: 'redirect_uri does not match the authorization code',
      })
    }

    if (code.oauthAppId !== app.id) {
      return response.badRequest({
        error: OAUTH_ERRORS.invalid_grant,
        error_description: 'Authorization code was issued to a different client',
      })
    }

    // ---------- PKCE enforcement ----------
    // Required for all public clients; required whenever the authorize
    // call specified a challenge (regardless of client kind).
    const isPublic = oauthAppService.isPublicClient(app)
    if (isPublic && !code.codeChallenge) {
      return response.badRequest({
        error: OAUTH_ERRORS.invalid_grant,
        error_description: 'PKCE is required for public clients',
      })
    }
    if (code.codeChallenge) {
      if (!payload.code_verifier) {
        return response.badRequest({
          error: OAUTH_ERRORS.invalid_grant,
          error_description: 'code_verifier is required for this authorization code',
        })
      }
      const ok = oauthCrypto.verifyPkce(
        payload.code_verifier,
        code.codeChallenge,
        code.codeChallengeMethod || 'S256'
      )
      if (!ok) {
        return response.badRequest({
          error: OAUTH_ERRORS.invalid_grant,
          error_description: 'PKCE verification failed',
        })
      }
    }

    const issued = await oauthTokenService.issue({
      oauthAppId: app.id,
      userId: code.userId,
      scopes: code.scopes,
      deviceName: payload.device_name ?? null,
      devicePlatform: payload.device_platform ?? null,
      deviceOs: payload.device_os ?? null,
      ip: request.ip(),
      userAgent: request.header('user-agent') ?? null,
    })

    await oauthWebhookService.enqueue(app, 'token.issued', {
      user_id: code.userId,
      token_id: issued.record.id,
      scopes: code.scopes,
      device_name: payload.device_name ?? null,
      ip: request.ip(),
    })

    return response.ok({
      access_token: issued.rawAccessToken,
      refresh_token: issued.rawRefreshToken,
      token_type: 'Bearer',
      expires_in: Math.max(0, Math.floor(issued.accessTokenExpiresAt.diffNow('seconds').seconds)),
      refresh_expires_in: Math.max(
        0,
        Math.floor(issued.refreshTokenExpiresAt.diffNow('seconds').seconds)
      ),
      scope: code.scopes.join(' '),
    })
  }

  // ---------- refresh_token grant ----------
  private async handleRefreshToken(payload: any, app: any, request: any, response: any) {
    if (!payload.refresh_token) {
      return response.badRequest({
        error: OAUTH_ERRORS.invalid_request,
        error_description: 'refresh_token is required for refresh_token grant',
      })
    }

    const current = await oauthTokenService.findActiveByRefreshToken(payload.refresh_token)
    if (!current) {
      return response.badRequest({
        error: OAUTH_ERRORS.invalid_grant,
        error_description: 'refresh_token is invalid, expired or revoked',
      })
    }
    if (current.oauthAppId !== app.id) {
      return response.badRequest({
        error: OAUTH_ERRORS.invalid_grant,
        error_description: 'refresh_token was issued to a different client',
      })
    }

    const issued = await oauthTokenService.rotate(
      current,
      request.ip(),
      request.header('user-agent') ?? null
    )

    await oauthWebhookService.enqueue(app, 'token.refreshed', {
      user_id: issued.record.userId,
      old_token_id: current.id,
      new_token_id: issued.record.id,
      ip: request.ip(),
    })

    return response.ok({
      access_token: issued.rawAccessToken,
      refresh_token: issued.rawRefreshToken,
      token_type: 'Bearer',
      expires_in: Math.max(0, Math.floor(issued.accessTokenExpiresAt.diffNow('seconds').seconds)),
      refresh_expires_in: Math.max(
        0,
        Math.floor(issued.refreshTokenExpiresAt.diffNow('seconds').seconds)
      ),
      scope: issued.record.scopes.join(' '),
    })
  }
}
