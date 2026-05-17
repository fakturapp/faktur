import type { HttpContext } from '@adonisjs/core/http'
import TeamMember from '#models/team/team_member'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import recoveryKeyService from '#services/crypto/recovery_key_service'

export default class ShowRecoveryKey {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const membership = await TeamMember.query()
      .where('teamId', user.currentTeamId)
      .where('userId', user.id)
      .where('status', 'active')
      .first()

    if (!membership || !['super_admin', 'admin'].includes(membership.role)) {
      return response.forbidden({ message: 'Only admins can access the recovery key' })
    }

    if (!membership.encryptedRecoveryKey) {
      return response.notFound({
        code: 'RECOVERY_KEY_UNAVAILABLE',
        message:
          "Cette \u00e9quipe ne dispose pas d'une clef de secours stock\u00e9e. Elle a probablement \u00e9t\u00e9 cr\u00e9\u00e9e avant ce renforcement du chiffrement.",
      })
    }

    try {
      const recoveryKey = recoveryKeyService.decryptStoredRecoveryKey(
        membership.encryptedRecoveryKey
      )

      return response.ok({
        recoveryKey: zeroAccessCryptoService.formatRecoveryKey(recoveryKey),
      })
    } catch {
      return response.unprocessableEntity({
        code: 'RECOVERY_KEY_DECRYPT_FAILED',
        message:
          "La clef de secours stock\u00e9e n'a pas pu \u00eatre d\u00e9chiffr\u00e9e avec la configuration serveur actuelle.",
      })
    }
  }
}
