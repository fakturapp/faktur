import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import db from '@adonisjs/lucid/services/db'
import TeamMember from '#models/team/team_member'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import encryptionService from '#services/encryption/encryption_service'
import keyStore from '#services/crypto/key_store'

/**
 * Vault middleware — ensures the user's DEK is available in memory.
 * If not (e.g. after server restart), attempts auto-recovery from the
 * encrypted KEK stored in the access token row.
 * Falls back to HTTP 423 VAULT_LOCKED if no encrypted KEK is available.
 */
export default class VaultMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    if (!user || !user.currentTeamId) {
      return next()
    }

    let dek = keyStore.getDEK(user.id, user.currentTeamId)

    // Auto-recovery: if keyStore is empty (server restart), try to restore from DB
    if (!dek) {
      const sessionKeyHex = ctx.request.header('X-Vault-Key')
      dek = await this.tryRecoverFromDb(user.id, user.currentTeamId, String(user.currentAccessToken.identifier), sessionKeyHex)
    }

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

  private async tryRecoverFromDb(
    userId: string,
    teamId: string,
    tokenIdentifier: string,
    sessionKeyHex?: string
  ): Promise<Buffer | null> {
    try {
      // Need the client-side session key to decrypt
      if (!sessionKeyHex) {
        return null
      }

      // 1. Load encrypted KEK from the access token row
      const tokenRow = await db
        .from('auth_access_tokens')
        .where('id', String(tokenIdentifier))
        .select('encrypted_kek')
        .first()

      if (!tokenRow?.encrypted_kek) {
        return null
      }

      // 2. Dual-key decrypt: layer2 with ENCRYPTION_KEY, then layer1 with sessionKey
      const sessionKey = Buffer.from(sessionKeyHex, 'hex')
      const layer1 = encryptionService.decrypt(tokenRow.encrypted_kek)
      const kekHex = encryptionService.decryptWithCustomKey(layer1, sessionKey)
      const kek = Buffer.from(kekHex, 'hex')

      // 3. Load the encrypted team DEK from team_members
      const teamMember = await TeamMember.query()
        .where('teamId', teamId)
        .where('userId', userId)
        .where('status', 'active')
        .first()

      if (!teamMember?.encryptedTeamDek) {
        return null
      }

      // 4. Decrypt team DEK using the recovered KEK
      const dek = zeroAccessCryptoService.decryptDEK(teamMember.encryptedTeamDek, kek)

      // 5. Re-populate the in-memory keyStore
      keyStore.storeKeys(userId, kek, teamId, dek)

      return dek
    } catch {
      return null
    }
  }
}
