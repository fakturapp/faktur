import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import Team from '#models/team/team'
import { deleteTeamCascade } from '#services/team/delete_team_service'

const deleteTeamValidator = vine.compile(
  vine.object({
    password: vine.string().minLength(1),
    confirmName: vine.string().trim(),
  })
)

export default class DeleteTeam {
  async handle({ auth, params, request, response }: HttpContext) {
    const admin = auth.user!
    const payload = await request.validateUsing(deleteTeamValidator)

    // Confirmation 1 — admin re-authenticates with their own password
    const valid = await hash.verify(admin.password, payload.password)
    if (!valid) {
      return response.unauthorized({ message: 'Mot de passe administrateur incorrect' })
    }

    const team = await Team.find(params.id)
    if (!team) {
      return response.notFound({ message: 'Équipe introuvable' })
    }

    // Confirmation 2 — the typed name must match the team
    if (payload.confirmName !== team.name) {
      return response.unprocessableEntity({ message: "Le nom de l'équipe ne correspond pas" })
    }

    // Free any user pointing here as their current team, then cascade-delete
    await db.from('users').where('current_team_id', team.id).update({ current_team_id: null })
    await deleteTeamCascade(team.id)

    return response.ok({ message: 'Équipe supprimée définitivement' })
  }
}
