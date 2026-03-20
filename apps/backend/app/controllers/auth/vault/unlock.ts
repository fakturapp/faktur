import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import User from '#models/account/user'
import TeamMember from '#models/team/team_member'
import crypto from 'node:crypto'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import encryptionService from '#services/encryption/encryption_service'
import keyStore from '#services/crypto/key_store'

const unlockValidator = vine.compile(
  vine.object({
    password: vine.string(),
  })
)

export default class VaultUnlock {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const { password } = await request.validateUsing(unlockValidator)

    // Verify password
    const passwordValid = await User.verifyCredentials(user.email, password)
      .then(() => true)
      .catch(() => false)

    if (!passwordValid) {
      return response.unauthorized({ message: 'Mot de passe incorrect' })
    }

    // Derive KEK from password
    if (!user.saltKdf) {
      return response.badRequest({ message: 'No encryption salt found for this account' })
    }

    const salt = Buffer.from(user.saltKdf, 'hex')
    const kek = await zeroAccessCryptoService.deriveKEK(password, salt)

    // Load team DEK if user has a current team
    if (user.currentTeamId && !user.cryptoResetNeeded) {
      const teamMember = await TeamMember.query()
        .where('teamId', user.currentTeamId)
        .where('userId', user.id)
        .where('status', 'active')
        .first()

      if (teamMember?.encryptedTeamDek) {
        const teamDek = zeroAccessCryptoService.decryptDEK(teamMember.encryptedTeamDek, kek)
        keyStore.storeKeys(user.id, kek, user.currentTeamId, teamDek)
      } else {
        keyStore.storeKeys(user.id, kek, '', Buffer.alloc(0))
      }
    } else {
      keyStore.storeKeys(user.id, kek, '', Buffer.alloc(0))
    }

    // Dual-key split: encrypt KEK with sessionKey (client) then ENCRYPTION_KEY (server)
    const tokenId = user.currentAccessToken.identifier
    const sessionKey = crypto.randomBytes(32)
    const layer1 = encryptionService.encryptWithCustomKey(kek.toString('hex'), sessionKey)
    const layer2 = encryptionService.encrypt(layer1)
    await db
      .from('auth_access_tokens')
      .where('id', String(tokenId))
      .update({ encrypted_kek: layer2 })

    return response.ok({ message: 'Vault unlocked', vaultKey: sessionKey.toString('hex') })
  }
}
