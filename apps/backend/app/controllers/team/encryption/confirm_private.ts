import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import { confirmPrivateValidator } from '#validators/team/encryption_validators'

export default class ConfirmPrivate {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(confirmPrivateValidator)

    if (!payload.ackDataLoss || !payload.ackNotResponsible) {
      return response.unprocessableEntity({
        message: 'Vous devez accepter les avertissements pour conserver le mode Privé.',
      })
    }

    const team = await Team.find(payload.teamId)
    if (!team) {
      return response.notFound({ message: 'Équipe introuvable' })
    }

    const membership = await TeamMember.query()
      .where('teamId', team.id)
      .where('userId', user.id)
      .where('status', 'active')
      .first()

    if (!membership || membership.role !== 'super_admin') {
      return response.forbidden({
        message: "Seul le propriétaire peut configurer le chiffrement de l'équipe.",
      })
    }

    if (team.encryptionMode !== 'private') {
      return response.conflict({
        message: "Cette équipe n'est pas en mode Privé.",
      })
    }

    team.encryptionModeConfirmedAt = DateTime.now()
    await team.save()

    return response.ok({
      message: 'Mode Privé confirmé',
      team: {
        id: team.id,
        encryptionMode: team.encryptionMode,
        encryptionModeConfirmedAt: team.encryptionModeConfirmedAt,
      },
    })
  }
}
