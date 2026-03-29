import type { HttpContext } from '@adonisjs/core/http'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import Team from '#models/team/team'
import r2StorageService from '#services/storage/r2_storage_service'

export default class UploadIcon {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const team = await Team.find(user.currentTeamId)
    if (!team) {
      return response.notFound({ message: 'Team not found' })
    }

    // Check if using company logo
    const useCompanyLogo = request.input('useCompanyLogo')
    if (useCompanyLogo) {
      const company = await team.related('company').query().first()
      if (!company?.logoUrl) {
        return response.badRequest({ message: "Aucun logo d'entreprise trouvé" })
      }
      team.iconUrl = company.logoUrl
      await team.save()
      return response.ok({ message: 'Logo mis à jour', iconUrl: team.iconUrl })
    }

    const icon = request.file('icon', {
      size: '2mb',
      extnames: ['jpg', 'jpeg', 'png', 'svg', 'webp'],
    })

    if (!icon) {
      return response.badRequest({ message: 'Aucun fichier fourni' })
    }

    if (!icon.isValid) {
      return response.badRequest({ message: icon.errors[0]?.message || 'Fichier invalide' })
    }

    if (!icon.tmpPath) {
      return response.badRequest({ message: 'Fichier temporaire introuvable' })
    }

    const fileName = `${team.id}-${randomUUID()}.${icon.extname}`
    const buffer = await readFile(icon.tmpPath)
    const contentType = icon.headers?.['content-type'] || 'image/png'

    team.iconUrl = await r2StorageService.upload('team-icons', fileName, buffer, contentType)
    await team.save()

    return response.ok({
      message: 'Logo mis à jour',
      iconUrl: team.iconUrl,
    })
  }
}
