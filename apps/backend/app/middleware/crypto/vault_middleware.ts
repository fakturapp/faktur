import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import keyStore from '#services/crypto/key_store'
import keyStoreWarmer from '#services/crypto/key_store_warmer'
import { buildStructuredErrorResponse } from '#services/http/error_response_service'
import { logRequestError } from '#services/http/request_error_log_service'

export default class VaultMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    if (!user || !user.currentTeamId) {
      return next()
    }

    let dek = keyStore.getDEK(user.id, user.currentTeamId)

    if (!dek) {
      const sessionKeyHex = ctx.request.header('X-Vault-Key')
      const warmed = await keyStoreWarmer.warmFromRequest(
        user.id,
        user.currentTeamId,
        String(user.currentAccessToken.identifier),
        sessionKeyHex
      )
      dek = warmed ? keyStore.getDEK(user.id, user.currentTeamId) : null
    }

    if (!dek) {
      await logRequestError(ctx, {
        status: 423,
        errorCode: 'vault_locked',
        errorType: 'vault_locked_error',
      })
      return ctx.response.status(423).send(
        buildStructuredErrorResponse(ctx, {
          errorCode: 'vault_locked',
          message: 'Vault is locked. Please provide your password to unlock.',
        })
      )
    }

    ;(ctx as any).dek = dek

    return next()
  }
}
