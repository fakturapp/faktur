import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import keyStore from '#services/crypto/key_store'

/**
 * Vault middleware — ensures the user's DEK is available in memory.
 * If not (e.g. after server restart or Google OAuth login without password),
 * returns HTTP 423 VAULT_LOCKED to prompt the user to unlock with their password.
 */
export default class VaultMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    if (!user || !user.currentTeamId) {
      return next()
    }

    const dek = keyStore.getDEK(user.id, user.currentTeamId)
    if (!dek) {
      return ctx.response.status(423).send({
        code: 'VAULT_LOCKED',
        message: 'Vault is locked. Please provide your password to unlock.',
      })
    }

    // Attach DEK to the context for downstream controllers
    ;(ctx as any).dek = dek

    return next()
  }
}
