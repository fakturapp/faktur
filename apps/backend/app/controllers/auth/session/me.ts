import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import AuthProvider from '#models/account/auth_provider'
import TeamMember from '#models/team/team_member'
import keyStore from '#services/crypto/key_store'
import encryptionService from '#services/encryption/encryption_service'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import UserTransformer from '#transformers/user_transformer'

export default class Me {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!

    const googleProvider = await AuthProvider.query()
      .where('userId', user.id)
      .where('provider', 'google')
      .first()

    // Check if vault is locked (crypto enabled but DEK not in memory)
    let vaultLocked =
      user.saltKdf && user.currentTeamId ? !keyStore.isUnlocked(user.id, user.currentTeamId) : false

    // Auto-recovery: if vault appears locked but client has the session key,
    // try to recover from DB without forcing the user to re-enter password
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

    return response.ok({
      user: {
        ...(await ctx.serialize.withoutWrapping(UserTransformer.transform(user))),
        hasGoogleProvider: !!googleProvider,
        vaultLocked,
      },
    })
  }

  private async tryAutoRecover(
    userId: string,
    teamId: string,
    tokenIdentifier: string,
    sessionKeyHex: string
  ): Promise<boolean> {
    try {
      const tokenRow = await db
        .from('auth_access_tokens')
        .where('id', String(tokenIdentifier))
        .select('encrypted_kek')
        .first()

      if (!tokenRow?.encrypted_kek) return false

      const sessionKey = Buffer.from(sessionKeyHex, 'hex')
      const layer1 = encryptionService.decrypt(tokenRow.encrypted_kek)
      const kekHex = encryptionService.decryptWithCustomKey(layer1, sessionKey)
      const kek = Buffer.from(kekHex, 'hex')

      const teamMember = await TeamMember.query()
        .where('teamId', teamId)
        .where('userId', userId)
        .where('status', 'active')
        .first()

      if (!teamMember?.encryptedTeamDek) return false

      const dek = zeroAccessCryptoService.decryptDEK(teamMember.encryptedTeamDek, kek)
      keyStore.storeKeys(userId, kek, teamId, dek)

      return true
    } catch {
      return false
    }
  }
}
