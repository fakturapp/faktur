import type { HttpContext } from '@adonisjs/core/http'
import storageService from '#services/storage/storage_service'

export default class Files {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.badRequest({ message: 'Aucune équipe sélectionnée' })
    }

    await storageService.reconcileActiveFiles(user.currentTeamId)

    const files = await storageService.listFiles(user.currentTeamId)
    return response.ok({ files })
  }
}
