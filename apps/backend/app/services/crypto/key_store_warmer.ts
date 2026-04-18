import db from '@adonisjs/lucid/services/db'
import TeamMember from '#models/team/team_member'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import encryptionService from '#services/encryption/encryption_service'
import keyStore from '#services/crypto/key_store'

export class KeyStoreWarmer {
  async warmKekFromRequest(
    userId: string,
    tokenIdentifier: string | null,
    sessionKeyHex: string | null | undefined
  ): Promise<Buffer | null> {
    if (!sessionKeyHex || !tokenIdentifier) return null

    try {
      const tokenRow = await db
        .from('auth_access_tokens')
        .where('id', tokenIdentifier)
        .select('encrypted_kek')
        .first()

      if (!tokenRow?.encrypted_kek) return null

      const sessionKey = Buffer.from(sessionKeyHex, 'hex')
      const layer1 = encryptionService.decrypt(tokenRow.encrypted_kek)
      const kekHex = encryptionService.decryptWithCustomKey(layer1, sessionKey)
      const kek = Buffer.from(kekHex, 'hex')

      keyStore.storeKeys(userId, kek, '', Buffer.alloc(0))
      return kek
    } catch {
      return null
    }
  }

  async warmFromRequest(
    userId: string,
    currentTeamId: string | null,
    tokenIdentifier: string | null,
    sessionKeyHex: string | null | undefined
  ): Promise<boolean> {
    const kek = await this.warmKekFromRequest(userId, tokenIdentifier, sessionKeyHex)
    if (!kek) return false

    try {
      if (currentTeamId) {
        const teamMember = await TeamMember.query()
          .where('teamId', currentTeamId)
          .where('userId', userId)
          .where('status', 'active')
          .first()

        const dek = this.decryptTeamDek(teamMember, kek)
        if (dek) {
          keyStore.storeKeys(userId, kek, currentTeamId, dek)
          return true
        }
      }

      return true
    } catch {
      return false
    }
  }

  private decryptTeamDek(teamMember: TeamMember | null, kek: Buffer): Buffer | null {
    if (!teamMember) {
      return null
    }

    if (teamMember.encryptedTeamDek) {
      try {
        return zeroAccessCryptoService.decryptDEK(teamMember.encryptedTeamDek, kek)
      } catch {}
    }

    if (teamMember.encryptedTeamDekRecovery) {
      try {
        return zeroAccessCryptoService.decryptDEK(teamMember.encryptedTeamDekRecovery, kek)
      } catch {}
    }

    return null
  }
}

export default new KeyStoreWarmer()
