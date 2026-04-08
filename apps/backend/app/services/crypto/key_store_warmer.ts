import db from '@adonisjs/lucid/services/db'
import TeamMember from '#models/team/team_member'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import encryptionService from '#services/encryption/encryption_service'
import keyStore from '#services/crypto/key_store'

export class KeyStoreWarmer {
  async warmFromRequest(
    userId: string,
    currentTeamId: string | null,
    tokenIdentifier: string | null,
    sessionKeyHex: string | null | undefined
  ): Promise<boolean> {
    if (!sessionKeyHex || !tokenIdentifier) return false

    try {
      const tokenRow = await db
        .from('auth_access_tokens')
        .where('id', tokenIdentifier)
        .select('encrypted_kek')
        .first()

      if (!tokenRow?.encrypted_kek) return false

      const sessionKey = Buffer.from(sessionKeyHex, 'hex')
      const layer1 = encryptionService.decrypt(tokenRow.encrypted_kek)
      const kekHex = encryptionService.decryptWithCustomKey(layer1, sessionKey)
      const kek = Buffer.from(kekHex, 'hex')

      if (currentTeamId) {
        const teamMember = await TeamMember.query()
          .where('teamId', currentTeamId)
          .where('userId', userId)
          .where('status', 'active')
          .first()

        if (teamMember?.encryptedTeamDek) {
          const dek = zeroAccessCryptoService.decryptDEK(teamMember.encryptedTeamDek, kek)
          keyStore.storeKeys(userId, kek, currentTeamId, dek)
          return true
        }
      }

      keyStore.storeKeys(userId, kek, '', Buffer.alloc(0))
      return true
    } catch {
      return false
    }
  }
}

export default new KeyStoreWarmer()
