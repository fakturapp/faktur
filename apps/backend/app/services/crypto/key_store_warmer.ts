import db from '@adonisjs/lucid/services/db'
import TeamMember from '#models/team/team_member'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import encryptionService from '#services/encryption/encryption_service'
import keyStore from '#services/crypto/key_store'

/**
 * Best-effort in-memory key store warmer.
 *
 * When the browser user lands on a route that does NOT go through the
 * `vault_middleware` but we still need the KEK to be available in
 * memory for downstream calls (e.g. the OAuth exchange-session
 * endpoint that the desktop will hit shortly after), this helper
 * replays the same dual-layer decrypt logic and populates the
 * in-process key store.
 *
 * Unlike the middleware, failures here are silent — the calling
 * controller decides whether the missing vault key is actionable.
 */
export class KeyStoreWarmer {
  /**
   * Restores the user's KEK + current team DEK into the in-memory
   * keyStore using the session key the client has in localStorage
   * (surfaced via the X-Vault-Key header).
   *
   * Returns true if at least the KEK was successfully restored.
   */
  async warmFromRequest(
    userId: string,
    currentTeamId: string | null,
    tokenIdentifier: string | null,
    sessionKeyHex: string | null | undefined
  ): Promise<boolean> {
    if (!sessionKeyHex || !tokenIdentifier) return false

    try {
      // 1. Load encrypted KEK from the access token row
      const tokenRow = await db
        .from('auth_access_tokens')
        .where('id', tokenIdentifier)
        .select('encrypted_kek')
        .first()

      if (!tokenRow?.encrypted_kek) return false

      // 2. Dual-key decrypt: layer2 with ENCRYPTION_KEY, then layer1 with sessionKey
      const sessionKey = Buffer.from(sessionKeyHex, 'hex')
      const layer1 = encryptionService.decrypt(tokenRow.encrypted_kek)
      const kekHex = encryptionService.decryptWithCustomKey(layer1, sessionKey)
      const kek = Buffer.from(kekHex, 'hex')

      // 3. Store the bare KEK (team DEK is optional here — the desktop
      //    exchange endpoint can rehydrate it later from the same team)
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

      // No current team → just stash the KEK with an empty DEK so
      // getKEK() works later. The desktop will reload the team DEK
      // during exchange-session if needed.
      keyStore.storeKeys(userId, kek, '', Buffer.alloc(0))
      return true
    } catch {
      return false
    }
  }
}

export default new KeyStoreWarmer()
