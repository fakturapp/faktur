import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import { createTeamValidator } from '#validators/auth/onboarding_validators'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import keyStore from '#services/crypto/key_store'

export default class CreateTeam {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!

    if (user.currentTeamId) {
      return response.conflict({ message: 'You already have a team' })
    }

    const kek = keyStore.getKEK(user.id)
    if (!kek) {
      return response.status(423).send({ code: 'VAULT_LOCKED', message: 'Vault is locked' })
    }

    const payload = await request.validateUsing(createTeamValidator)

    const team = await Team.create({
      name: payload.name,
      iconUrl: payload.iconUrl ?? null,
      ownerId: user.id,
    })

    const teamDek = zeroAccessCryptoService.generateDEK()
    const encryptedTeamDek = zeroAccessCryptoService.encryptDEK(teamDek, kek)

    await TeamMember.create({
      teamId: team.id,
      userId: user.id,
      role: 'super_admin',
      status: 'active',
      joinedAt: DateTime.now(),
      encryptedTeamDek,
      dekVersion: 1,
    })

    keyStore.storeDEK(user.id, team.id, teamDek)

    user.currentTeamId = team.id
    await user.save()

    return response.created({
      message: 'Team created successfully',
      team: {
        id: team.id,
        name: team.name,
        iconUrl: team.iconUrl,
      },
    })
  }
}
