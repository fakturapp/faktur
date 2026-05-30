import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import User from '#models/account/user'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import keyStore from '#services/crypto/key_store'
import { isAdminEmail } from '#services/auth/is_admin'
import { deleteTeamCascade } from '#services/team/delete_team_service'

const deleteUserValidator = vine.compile(
  vine.object({
    password: vine.string().minLength(1),
    confirmEmail: vine.string().trim(),
  })
)

export default class DeleteUser {
  async handle({ auth, params, request, response }: HttpContext) {
    const admin = auth.user!
    const payload = await request.validateUsing(deleteUserValidator)

    const validPassword = await hash.verify(admin.password, payload.password)
    if (!validPassword) {
      return response.unauthorized({ message: 'Mot de passe administrateur incorrect' })
    }

    const target = await User.find(params.id)
    if (!target) {
      return response.notFound({ message: 'Utilisateur introuvable' })
    }

    if (target.id === admin.id) {
      return response.badRequest({
        message: 'Vous ne pouvez pas supprimer votre propre compte depuis le panel.',
      })
    }

    if (isAdminEmail(target.email)) {
      return response.forbidden({ message: 'Impossible de supprimer un autre administrateur.' })
    }

    if (payload.confirmEmail.toLowerCase() !== target.email.toLowerCase()) {
      return response.unprocessableEntity({ message: "L'email ne correspond pas" })
    }

    const ownedTeams = await Team.query().where('ownerId', target.id)
    const ownedTeamIds = ownedTeams.map((t) => t.id)

    if (ownedTeamIds.length > 0) {
      await db.from('users').whereIn('current_team_id', ownedTeamIds).update({ current_team_id: null })
    }
    for (const team of ownedTeams) {
      await deleteTeamCascade(team.id)
    }

    await TeamMember.query().where('userId', target.id).delete()

    keyStore.clear(target.id)
    target.currentTeamId = null
    await target.save()
    await target.delete()

    return response.ok({
      message: 'Utilisateur supprimé définitivement',
      deletedTeams: ownedTeamIds.length,
    })
  }
}
