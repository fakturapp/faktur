import type { HttpContext } from '@adonisjs/core/http'
import TeamMember from '#models/team/team_member'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import keyStore from '#services/crypto/key_store'

/**
 * POST /auth/crypto/recover
 * User provides their OLD password to re-encrypt DEKs with new KEK.
 * This preserves all encrypted data after a password reset.
 */
export default class CryptoRecover {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!

    if (!user.cryptoResetNeeded) {
      return response.badRequest({ message: 'No crypto recovery needed' })
    }

    const { oldPassword } = request.only(['oldPassword'])
    if (!oldPassword) {
      return response.badRequest({ message: 'Old password is required' })
    }

    if (!user.oldSaltKdf) {
      return response.badRequest({ message: 'Recovery data not available. Please start fresh.' })
    }

    // Derive old KEK from old password + old salt
    const oldSalt = Buffer.from(user.oldSaltKdf, 'hex')
    let oldKek: Buffer
    try {
      oldKek = await zeroAccessCryptoService.deriveKEK(oldPassword, oldSalt)
    } catch {
      return response.badRequest({ message: 'Failed to derive key from old password' })
    }

    // Get new KEK from memory (stored during login with new password)
    const newKek = keyStore.getKEK(user.id)
    if (!newKek) {
      return response.unauthorized({ code: 'SESSION_EXPIRED', message: 'Session expired. Please log in again.' })
    }

    // Re-encrypt all team DEKs: decrypt with old KEK → encrypt with new KEK
    const memberships = await TeamMember.query()
      .where('userId', user.id)
      .where('status', 'active')
      .whereNotNull('encryptedTeamDek')

    try {
      for (const membership of memberships) {
        const teamDek = zeroAccessCryptoService.decryptDEK(membership.encryptedTeamDek!, oldKek)
        membership.encryptedTeamDek = zeroAccessCryptoService.encryptDEK(teamDek, newKek)
        await membership.save()

        // Load DEK into memory
        keyStore.storeDEK(user.id, membership.teamId, teamDek)
      }
    } catch {
      return response.unprocessableEntity({
        message: 'Ancien mot de passe incorrect. Impossible de déchiffrer vos données.',
      })
    }

    // Clear crypto reset flag
    user.cryptoResetNeeded = false
    user.oldSaltKdf = null
    await user.save()

    // Reload current team DEK if needed
    if (user.currentTeamId) {
      const dek = keyStore.getDEK(user.id, user.currentTeamId)
      if (dek) {
        keyStore.storeKeys(user.id, newKek, user.currentTeamId, dek)
      }
    }

    return response.ok({ message: 'Données récupérées avec succès' })
  }
}
