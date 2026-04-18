import User from '#models/account/user'
import TeamMember from '#models/team/team_member'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'

interface RecoveryKeyRotationResult {
  recoveryKey: string
  formattedRecoveryKey: string
  membershipsUpdated: number
}

class RecoveryKeyService {
  async rotateForUser(user: User, kek: Buffer): Promise<RecoveryKeyRotationResult> {
    const memberships = await TeamMember.query()
      .where('userId', user.id)
      .where('status', 'active')
      .whereNotNull('encryptedTeamDek')

    const recoveryKey = zeroAccessCryptoService.generateRecoveryKey()
    const recoveryKEK = zeroAccessCryptoService.deriveRecoveryKEK(recoveryKey)

    for (const membership of memberships) {
      const teamDek = zeroAccessCryptoService.decryptDEK(membership.encryptedTeamDek!, kek)
      membership.encryptedTeamDekRecovery = zeroAccessCryptoService.encryptDEK(teamDek, recoveryKEK)
      await membership.save()
    }

    user.recoveryKeyHash = zeroAccessCryptoService.hashRecoveryKey(recoveryKey)
    user.hasRecoveryKey = true
    await user.save()

    return {
      recoveryKey,
      formattedRecoveryKey: zeroAccessCryptoService.formatRecoveryKey(recoveryKey),
      membershipsUpdated: memberships.length,
    }
  }
}

export default new RecoveryKeyService()
