import type { HttpContext } from '@adonisjs/core/http'
import storageService from '#services/storage/storage_service'

export default class DeleteFile {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.badRequest({ message: 'Aucune équipe sélectionnée' })
    }

    const deleted = await storageService.deleteFile(user.currentTeamId, params.id)
    if (!deleted) {
      return response.notFound({ message: 'Fichier introuvable' })
    }

    return response.ok({ deleted: true })
  }
}
