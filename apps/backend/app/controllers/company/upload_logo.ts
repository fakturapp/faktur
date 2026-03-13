import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import Company from '#models/team/company'

export default class UploadLogo {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const company = await Company.findBy('teamId', user.currentTeamId)
    if (!company) {
      return response.notFound({ message: 'No company found' })
    }

    const logo = request.file('logo', {
      size: '2mb',
      extnames: ['jpg', 'jpeg', 'png', 'svg', 'webp'],
    })

    if (!logo) {
      return response.badRequest({ message: 'Aucun fichier fourni' })
    }

    if (!logo.isValid) {
      return response.badRequest({ message: logo.errors[0]?.message || 'Fichier invalide' })
    }

    const uploadsDir = join(app.tmpPath(), 'uploads', 'company-logos')
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true })
    }

    const fileName = `${user.currentTeamId}-${randomUUID()}.${logo.extname}`
    await logo.move(uploadsDir, { name: fileName, overwrite: true })

    const logoUrl = `/company-logos/${fileName}`
    company.logoUrl = logoUrl
    await company.save()

    return response.ok({
      message: 'Logo mis à jour',
      logoUrl,
    })
  }
}
