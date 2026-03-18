import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import keyStore from '#services/crypto/key_store'

/**
 * Vault middleware — ensures the user's DEK is available in memory.
 * If not (e.g. after server restart), returns HTTP 401 to force a full
 * re-login (Proton model: fully unlocked or fully logged out, no in-between).
 */
export default class VaultMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    if (!user || !user.currentTeamId) {
      return next()
    }

    const dek = keyStore.getDEK(user.id, user.currentTeamId)
    if (!dek) {
      // DEK not in memory — force full re-login like Proton does
      return ctx.response.unauthorized({
        code: 'SESSION_EXPIRED',
        message: 'Session expired. Please log in again.',
      })
    }

    // Attach DEK to the context for downstream controllers
    ;(ctx as any).dek = dek

    return next()
  }
}
