import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import hash from '@adonisjs/core/services/hash'
import TeamMember from '#models/team/team_member'
import Team from '#models/team/team'
import { deleteTeamCascade } from '#services/team/delete_team_service'
import { validateDeletionSession } from './_helpers.js'

const resolveTeamValidator = vine.compile(
  vine.object({
    teamId: vine.string().uuid(),
    action: vine.enum(['delete', 'transfer', 'leave']),
    password: vine.string().optional(),
    transferToUserId: vine.string().uuid().optional(),
  })
)

export default class ResolveTeam {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const token = request.header('x-deletion-token')

    const error = validateDeletionSession(user, token)
    if (error) return response.badRequest({ message: error })

    const payload = await request.validateUsing(resolveTeamValidator)

    const membership = await TeamMember.query()
      .where('teamId', payload.teamId)
      .where('userId', user.id)
      .where('status', 'active')
      .first()

    if (!membership) {
      return response.notFound({ message: "Vous n'êtes pas membre de cette équipe" })
    }

    const team = await Team.find(payload.teamId)
    if (!team) {
      return response.notFound({ message: 'Équipe introuvable' })
    }

    if (payload.action === 'leave') {
      if (membership.role === 'super_admin') {
        return response.forbidden({ message: 'Le propriétaire ne peut pas quitter. Transférez ou supprimez.' })
      }
      await membership.delete()
      return response.ok({ message: "Vous avez quitté l'équipe" })
    }

    if (payload.action === 'delete') {
      if (membership.role !== 'super_admin') {
        return response.forbidden({ message: "Seul le propriétaire peut supprimer l'équipe" })
      }
      if (!payload.password) {
        return response.badRequest({ message: 'Mot de passe requis' })
      }
      const isValid = await hash.verify(user.password, payload.password)
      if (!isValid) {
        return response.unauthorized({ message: 'Mot de passe incorrect' })
      }
      await deleteTeamCascade(payload.teamId)
      return response.ok({ message: 'Équipe supprimée' })
    }

    if (payload.action === 'transfer') {
      if (membership.role !== 'super_admin') {
        return response.forbidden({ message: "Seul le propriétaire peut transférer l'équipe" })
      }
      if (!payload.transferToUserId) {
        return response.badRequest({ message: 'Utilisateur cible requis' })
      }

      const targetMember = await TeamMember.query()
        .where('teamId', payload.teamId)
        .where('userId', payload.transferToUserId)
        .where('status', 'active')
        .first()

      if (!targetMember) {
        return response.notFound({ message: 'Le membre cible est introuvable dans cette équipe' })
      }

      // Transfer: set target as super_admin, demote current owner to admin
      targetMember.role = 'super_admin'
      await targetMember.save()

      membership.role = 'admin'
      await membership.save()

      // Update team owner
      team.ownerId = payload.transferToUserId
      await team.save()

      // Now remove the leaving user
      await membership.delete()

      return response.ok({ message: 'Propriété transférée et vous avez quitté' })
    }

    return response.badRequest({ message: 'Action invalide' })
  }
}
