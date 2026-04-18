import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import AuthProvider from '#models/account/auth_provider'
import PasskeyCredential from '#models/account/passkey_credential'
import keyStore from '#services/crypto/key_store'
import keyStoreWarmer from '#services/crypto/key_store_warmer'
import UserTransformer from '#transformers/user_transformer'

export default class Me {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!

    const [googleProvider, passkeyCount] = await Promise.all([
      AuthProvider.query()
        .where('userId', user.id)
        .where('provider', 'google')
        .first(),
      PasskeyCredential.query()
        .where('userId', user.id)
        .count('* as total')
        .first(),
    ])

    let vaultLocked =
      user.saltKdf && user.currentTeamId ? !keyStore.isUnlocked(user.id, user.currentTeamId) : false

    if (vaultLocked && user.currentTeamId) {
      const sessionKeyHex = request.header('X-Vault-Key')
      if (sessionKeyHex) {
        const recovered = await this.tryAutoRecover(
          user.id,
          user.currentTeamId,
          String(user.currentAccessToken.identifier),
          sessionKeyHex
        )
        if (recovered) {
          vaultLocked = false
        }
      }
    }

    const adminEmails = (env.get('ADMIN_EMAILS') || '')
      .split(/[,;]/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
    const isAdmin = adminEmails.includes(user.email.toLowerCase())

    return response.ok({
      user: {
        ...(await ctx.serialize.withoutWrapping(UserTransformer.transform(user))),
        hasGoogleProvider: !!googleProvider,
        hasPasskeys: Number(passkeyCount?.$extras.total || 0) > 0,
        vaultLocked,
        isAdmin,
      },
    })
  }

  private async tryAutoRecover(
    userId: string,
    teamId: string,
    tokenIdentifier: string,
    sessionKeyHex: string
  ): Promise<boolean> {
    return keyStoreWarmer.warmFromRequest(userId, teamId, tokenIdentifier, sessionKeyHex)
  }
}
