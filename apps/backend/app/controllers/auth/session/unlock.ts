import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/account/user'
import TeamMember from '#models/team/team_member'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import keyStore from '#services/crypto/key_store'

export default class Unlock {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const { password } = request.only(['password'])

    if (!password) {
      return response.badRequest({ message: 'Password is required' })
    }

    // Verify password
    try {
      await User.verifyCredentials(user.email, password)
    } catch {
      return response.unauthorized({ message: 'Invalid password' })
    }

    if (!user.saltKdf) {
      return response.badRequest({ message: 'No encryption key configured for this account' })
    }

    // Derive KEK
    const salt = Buffer.from(user.saltKdf, 'hex')
    const kek = await zeroAccessCryptoService.deriveKEK(password, salt)

    // Load DEK for current team
    if (user.currentTeamId) {
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

    return response.ok({ message: 'Vault unlocked successfully' })
  }
}
