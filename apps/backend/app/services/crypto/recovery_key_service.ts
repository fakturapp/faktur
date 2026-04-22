import User from '#models/account/user'
import TeamMember from '#models/team/team_member'
import encryptionService from '#services/encryption/encryption_service'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'

interface RecoveryKeyRotationResult {
  recoveryKey: string
  formattedRecoveryKey: string
  membershipsUpdated: number
  membershipsSkipped: number
}

class RecoveryKeyService {
  applyRecoveryKeyToMembership(membership: TeamMember, teamDek: Buffer, recoveryKey: string): void {
    const normalizedRecoveryKey = this.normalizeRecoveryKey(recoveryKey)
    const recoveryKEK = zeroAccessCryptoService.deriveRecoveryKEK(normalizedRecoveryKey)

    membership.encryptedTeamDekRecovery = zeroAccessCryptoService.encryptDEK(teamDek, recoveryKEK)
    membership.encryptedRecoveryKey = encryptionService.encrypt(normalizedRecoveryKey)
  }

  decryptStoredRecoveryKey(encryptedRecoveryKey: string): string {
    return this.normalizeRecoveryKey(encryptionService.decrypt(encryptedRecoveryKey))
  }

  async findStoredRecoveryKeyForUser(userId: string): Promise<string | null> {
    const memberships = await TeamMember.query()
      .where('userId', userId)
      .where('status', 'active')
      .whereNotNull('encryptedRecoveryKey')
      .orderBy('updatedAt', 'desc')

    for (const membership of memberships) {
      if (!membership.encryptedRecoveryKey) {
        continue
      }

      try {
        return this.decryptStoredRecoveryKey(membership.encryptedRecoveryKey)
      } catch {}
    }

    return null
  }

  async rotateForUser(user: User, kek: Buffer): Promise<RecoveryKeyRotationResult> {
    const memberships = await TeamMember.query()
      .where('userId', user.id)
      .where('status', 'active')
      .whereNotNull('encryptedTeamDek')

    const recoveryKey = zeroAccessCryptoService.generateRecoveryKey()
    let membershipsUpdated = 0

    for (const membership of memberships) {
      try {
        const teamDek = zeroAccessCryptoService.decryptDEK(membership.encryptedTeamDek!, kek)
        this.applyRecoveryKeyToMembership(membership, teamDek, recoveryKey)
        await membership.save()
        membershipsUpdated += 1
      } catch {}
    }

    user.recoveryKeyHash = zeroAccessCryptoService.hashRecoveryKey(recoveryKey)
    user.hasRecoveryKey = true
    await user.save()

    return {
      recoveryKey,
      formattedRecoveryKey: zeroAccessCryptoService.formatRecoveryKey(recoveryKey),
      membershipsUpdated,
      membershipsSkipped: memberships.length - membershipsUpdated,
    }
  }

  private normalizeRecoveryKey(recoveryKey: string): string {
    return recoveryKey.replace(/-/g, '').trim().toUpperCase()
  }
}

export default new RecoveryKeyService()
