import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import Team from '#models/team/team'

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
        return response.badRequest({ message: 'Aucun logo d\'entreprise trouvé' })
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

    const uploadsDir = join(app.tmpPath(), 'uploads', 'team-icons')
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true })
    }

    const fileName = `${team.id}-${randomUUID()}.${icon.extname}`
    await icon.move(uploadsDir, { name: fileName, overwrite: true })

    team.iconUrl = `/team-icons/${fileName}`
    await team.save()

    return response.ok({
      message: 'Logo mis à jour',
      iconUrl: team.iconUrl,
    })
  }
}
