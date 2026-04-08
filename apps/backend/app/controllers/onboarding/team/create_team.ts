import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import { createTeamValidator } from '#validators/auth/onboarding_validators'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import keyStore from '#services/crypto/key_store'
import RecoveryKeyGenerated from '#events/recovery_key_generated'

export default class CreateTeam {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!

    if (user.currentTeamId) {
      return response.conflict({ message: 'You already have a team' })
    }

    const kek = keyStore.getKEK(user.id)
    if (!kek) {
      return response.unauthorized({
        code: 'SESSION_EXPIRED',
        message: 'Session expired. Please log in again.',
      })
    }

    const payload = await request.validateUsing(createTeamValidator)

    const team = await Team.create({
      name: payload.name,
      iconUrl: payload.iconUrl ?? null,
      ownerId: user.id,
    })

    const teamDek = zeroAccessCryptoService.generateDEK()
    const encryptedTeamDek = zeroAccessCryptoService.encryptDEK(teamDek, kek)

    const recoveryKey = zeroAccessCryptoService.generateRecoveryKey()
    const recoveryKEK = zeroAccessCryptoService.deriveRecoveryKEK(recoveryKey)
    const encryptedTeamDekRecovery = zeroAccessCryptoService.encryptDEK(teamDek, recoveryKEK)

    await TeamMember.create({
      teamId: team.id,
      userId: user.id,
      role: 'super_admin',
      status: 'active',
      joinedAt: DateTime.now(),
      encryptedTeamDek,
      encryptedTeamDekRecovery,
      dekVersion: 1,
    })

    keyStore.storeDEK(user.id, team.id, teamDek)

    user.recoveryKeyHash = zeroAccessCryptoService.hashRecoveryKey(recoveryKey)
    user.hasRecoveryKey = true
    user.currentTeamId = team.id
    await user.save()

    RecoveryKeyGenerated.dispatch(user.email, recoveryKey, user.fullName ?? undefined)

    const formatted = zeroAccessCryptoService.formatRecoveryKey(recoveryKey)

    return response.created({
      message: 'Team created successfully',
      team: {
        id: team.id,
        name: team.name,
        iconUrl: team.iconUrl,
      },
      recoveryKey: formatted,
    })
  }
}
