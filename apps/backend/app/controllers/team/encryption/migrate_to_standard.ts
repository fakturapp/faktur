import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import encryptionService from '#services/encryption/encryption_service'
import keyStore from '#services/crypto/key_store'
import { migrateToStandardValidator } from '#validators/team/encryption_validators'

export default class MigrateToStandard {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(migrateToStandardValidator)

    const valid = await hash.verify(user.password, payload.password)
    if (!valid) {
      return response.unauthorized({ message: 'Mot de passe incorrect' })
    }

    if (!user.saltKdf) {
      return response.conflict({
        message: "Votre compte n'a pas de clef utilisateur active. Connectez-vous puis réessayez.",
      })
    }

    const team = await Team.find(payload.teamId)
    if (!team) {
      return response.notFound({ message: 'Équipe introuvable' })
    }

    const myMembership = await TeamMember.query()
      .where('teamId', team.id)
      .where('userId', user.id)
      .where('status', 'active')
      .first()

    if (!myMembership || myMembership.role !== 'super_admin') {
      return response.forbidden({
        message: "Seul le propriétaire peut migrer le chiffrement de l'équipe.",
      })
    }

    if (team.encryptionMode !== 'private') {
      return response.conflict({
        message: 'Cette équipe est déjà en mode Standard.',
      })
    }

    if (!myMembership.encryptedTeamDek) {
      return response.unprocessableEntity({
        message: 'Aucune clef chiffrée trouvée pour cette équipe.',
      })
    }

    const oldKek = await zeroAccessCryptoService.deriveKEK(
      payload.password,
      Buffer.from(user.saltKdf, 'hex')
    )

    let dek: Buffer
    try {
      dek = zeroAccessCryptoService.decryptDEK(myMembership.encryptedTeamDek, oldKek)
    } catch {
      return response.unprocessableEntity({
        message: 'Impossible de déchiffrer la clef. Mot de passe ou salt invalide.',
      })
    }

    const serverWrap = encryptionService.encrypt(dek.toString('hex'))

    const allMembers = await TeamMember.query()
      .where('teamId', team.id)
      .whereIn('status', ['active', 'pending'])

    for (const m of allMembers) {
      m.encryptedTeamDek = serverWrap
      m.encryptedTeamDekRecovery = null
      m.encryptedInviteDek = null
      m.encryptedRecoveryKey = null
      await m.save()
    }

    team.encryptionMode = 'standard'
    team.encryptionModeConfirmedAt = DateTime.now()
    await team.save()

    keyStore.storeServerDek(user.id, team.id, dek)

    return response.ok({
      message: 'Équipe migrée en mode Standard',
      team: {
        id: team.id,
        encryptionMode: team.encryptionMode,
        encryptionModeConfirmedAt: team.encryptionModeConfirmedAt,
      },
    })
  }
}
