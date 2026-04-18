import type { HttpContext } from '@adonisjs/core/http'
import TeamMember from '#models/team/team_member'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import keyStore from '#services/crypto/key_store'
import keyStoreWarmer from '#services/crypto/key_store_warmer'
import RecoveryKeyGenerated from '#events/recovery_key_generated'
import recoveryKeyService from '#services/crypto/recovery_key_service'

export default class CryptoRecover {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!

    if (!user.cryptoResetNeeded) {
      return response.badRequest({ message: 'No crypto recovery needed' })
    }

    const { oldPassword, recoveryKey } = request.only(['oldPassword', 'recoveryKey'])

    if (!oldPassword && !recoveryKey) {
      return response.badRequest({ message: 'Old password or recovery key is required' })
    }

    const newKek =
      keyStore.getKEK(user.id) ||
      (await keyStoreWarmer.warmKekFromRequest(
        user.id,
        String(user.currentAccessToken.identifier),
        request.header('X-Vault-Key')
      ))

    if (!newKek) {
      return response.unauthorized({
        code: 'SESSION_EXPIRED',
        message: 'Session expired. Please log in again.',
      })
    }

    const memberships = await TeamMember.query()
      .where('userId', user.id)
      .where('status', 'active')

    let rotatedRecoveryKey: string | null = null

    if (recoveryKey) {
      const normalizedKey = recoveryKey.replace(/-/g, '').toUpperCase()
      const recoveryKEK = zeroAccessCryptoService.deriveRecoveryKEK(normalizedKey)

      const membershipsWithRecovery = memberships.filter((membership) => membership.encryptedTeamDekRecovery)
      if (membershipsWithRecovery.length === 0) {
        return response.badRequest({
          message: 'Aucune clef de secours configurÃ©e pour ce compte',
        })
      }

      try {
        for (const membership of membershipsWithRecovery) {
          const teamDek = zeroAccessCryptoService.decryptDEK(
            membership.encryptedTeamDekRecovery!,
            recoveryKEK
          )

          membership.encryptedTeamDek = zeroAccessCryptoService.encryptDEK(teamDek, newKek)
          await membership.save()

          keyStore.storeDEK(user.id, membership.teamId, teamDek)
        }

        const rotation = await recoveryKeyService.rotateForUser(user, newKek)
        rotatedRecoveryKey = rotation.recoveryKey
      } catch {
        return response.unprocessableEntity({
          message: 'Clef de secours incorrecte. Impossible de dÃ©chiffrer vos donnÃ©es.',
        })
      }
    } else {
      if (!user.oldSaltKdf) {
        return response.badRequest({
          message: 'Recovery data not available. Please start fresh.',
        })
      }

      const oldSalt = Buffer.from(user.oldSaltKdf, 'hex')
      let oldKek: Buffer
      try {
        oldKek = await zeroAccessCryptoService.deriveKEK(oldPassword, oldSalt)
      } catch {
        return response.badRequest({ message: 'Failed to derive key from old password' })
      }

      const membershipsWithDek = memberships.filter((membership) => membership.encryptedTeamDek)
      const shouldRotateRecoveryKey =
        user.hasRecoveryKey ||
        membershipsWithDek.some((membership) => !!membership.encryptedTeamDekRecovery)

      try {
        for (const membership of membershipsWithDek) {
          const teamDek = zeroAccessCryptoService.decryptDEK(membership.encryptedTeamDek!, oldKek)
          membership.encryptedTeamDek = zeroAccessCryptoService.encryptDEK(teamDek, newKek)
          await membership.save()

          keyStore.storeDEK(user.id, membership.teamId, teamDek)
        }

        if (shouldRotateRecoveryKey) {
          const rotation = await recoveryKeyService.rotateForUser(user, newKek)
          rotatedRecoveryKey = rotation.recoveryKey
        }
      } catch {
        return response.unprocessableEntity({
          message: 'Ancien mot de passe incorrect. Impossible de dÃ©chiffrer vos donnÃ©es.',
        })
      }
    }

    user.cryptoResetNeeded = false
    user.oldSaltKdf = null
    await user.save()

    if (rotatedRecoveryKey) {
      RecoveryKeyGenerated.dispatch(user.email, rotatedRecoveryKey, user.fullName ?? undefined)
    }

    if (user.currentTeamId) {
      const dek = keyStore.getDEK(user.id, user.currentTeamId)
      if (dek) {
        keyStore.storeKeys(user.id, newKek, user.currentTeamId, dek)
      }
    }

    return response.ok({ message: 'DonnÃ©es rÃ©cupÃ©rÃ©es avec succÃ¨s' })
  }
}
