import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import db from '@adonisjs/lucid/services/db'
import TeamMember from '#models/team/team_member'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import encryptionService from '#services/encryption/encryption_service'
import keyStore from '#services/crypto/key_store'

export default class VaultMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    if (!user || !user.currentTeamId) {
      return next()
    }

    let dek = keyStore.getDEK(user.id, user.currentTeamId)

    if (!dek) {
      const sessionKeyHex = ctx.request.header('X-Vault-Key')
      dek = await this.tryRecoverFromDb(
        user.id,
        user.currentTeamId,
        String(user.currentAccessToken.identifier),
        sessionKeyHex
      )
    }

    if (!dek) {
      return ctx.response.status(423).send({
        code: 'VAULT_LOCKED',
        message: 'Vault is locked. Please provide your password to unlock.',
      })
    }

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
      if (!sessionKeyHex) {
        return null
      }

      const tokenRow = await db
        .from('auth_access_tokens')
        .where('id', String(tokenIdentifier))
        .select('encrypted_kek')
        .first()

      if (!tokenRow?.encrypted_kek) {
        return null
      }

      const sessionKey = Buffer.from(sessionKeyHex, 'hex')
      const layer1 = encryptionService.decrypt(tokenRow.encrypted_kek)
      const kekHex = encryptionService.decryptWithCustomKey(layer1, sessionKey)
      const kek = Buffer.from(kekHex, 'hex')

      const teamMember = await TeamMember.query()
        .where('teamId', teamId)
        .where('userId', userId)
        .where('status', 'active')
        .first()

      if (!teamMember?.encryptedTeamDek) {
        return null
      }

      const dek = zeroAccessCryptoService.decryptDEK(teamMember.encryptedTeamDek, kek)

      keyStore.storeKeys(userId, kek, teamId, dek)

      return dek
    } catch {
      return null
    }
  }
}
