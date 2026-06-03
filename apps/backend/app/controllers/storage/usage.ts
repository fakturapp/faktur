import type { HttpContext } from '@adonisjs/core/http'
import Team from '#models/team/team'
import storageService from '#services/storage/storage_service'

export default class Usage {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.badRequest({ message: 'Aucune équipe sélectionnée' })
    }

    const team = await Team.find(user.currentTeamId)
    if (!team) {
      return response.notFound({ message: 'Équipe introuvable' })
    }

    const usage = await storageService.usage(team.id, team.plan)
    return response.ok(usage)
  }
}
