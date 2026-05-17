import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import { createTeamValidator } from '#validators/auth/onboarding_validators'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import keyStore from '#services/crypto/key_store'
import RecoveryKeyGenerated from '#events/recovery_key_generated'
import recoveryKeyService from '#services/crypto/recovery_key_service'
import sessionKekResolver from '#services/crypto/session_kek_resolver'
import teamEncryptionService from '#services/crypto/team_encryption_service'

export default class CreateTeam {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!

    if (user.currentTeamId) {
      return response.conflict({ message: 'You already have a team' })
    }

    const payload = await request.validateUsing(createTeamValidator)
    const encryptionMode = payload.encryptionMode ?? 'standard'

    if (encryptionMode === 'private') {
      if (!payload.ackDataLoss || !payload.ackNotResponsible) {
        return response.unprocessableEntity({
          message: 'Vous devez accepter les avertissements pour activer le mode Privé.',
        })
      }
    }

    let kek: Buffer | null = null
    if (encryptionMode === 'private') {
      kek = await sessionKekResolver.resolvePrimary(user, request)

      if (!kek && payload.confirmPassword && user.saltKdf) {
        const valid = await hash.verify(user.password, payload.confirmPassword)
        if (!valid) {
          return response.unprocessableEntity({
            code: 'invalid_password',
            message: 'Mot de passe incorrect.',
          })
        }
        kek = await zeroAccessCryptoService.deriveKEK(
          payload.confirmPassword,
          Buffer.from(user.saltKdf, 'hex')
        )
        keyStore.storeKEK(user.id, kek)
      }

      if (!kek) {
        return response.unprocessableEntity({
          code: 'kek_required',
          message: 'Confirmez votre mot de passe pour activer le chiffrement Privé.',
        })
      }
    }

    const team = await Team.create({
      name: payload.name,
      iconUrl: payload.iconUrl ?? null,
      ownerId: user.id,
      encryptionMode,
      encryptionModeConfirmedAt: DateTime.now(),
    })

    const teamDek = zeroAccessCryptoService.generateDEK()
    const encryptedTeamDek = teamEncryptionService.wrapDekForTeam(team, teamDek, {
      userKek: kek ?? undefined,
    })

    await TeamMember.create({
      teamId: team.id,
      userId: user.id,
      role: 'super_admin',
      status: 'active',
      joinedAt: DateTime.now(),
      encryptedTeamDek,
      dekVersion: 1,
    })

    user.currentTeamId = team.id
    await user.save()

    if (encryptionMode === 'private' && kek) {
      keyStore.storeDEK(user.id, team.id, teamDek)
      const rotation = await recoveryKeyService.rotateForUser(user, kek)

      RecoveryKeyGenerated.dispatch(user.email, rotation.recoveryKey, user.fullName ?? undefined)

      return response.created({
        message: 'Team created successfully',
        team: {
          id: team.id,
          name: team.name,
          iconUrl: team.iconUrl,
          encryptionMode: team.encryptionMode,
        },
        recoveryKey: rotation.formattedRecoveryKey,
      })
    }

    keyStore.storeServerDek(user.id, team.id, teamDek)

    return response.created({
      message: 'Team created successfully',
      team: {
        id: team.id,
        name: team.name,
        iconUrl: team.iconUrl,
        encryptionMode: team.encryptionMode,
      },
    })
  }
}
