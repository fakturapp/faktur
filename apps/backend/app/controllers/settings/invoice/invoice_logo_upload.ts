import type { HttpContext } from '@adonisjs/core/http'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import InvoiceSetting from '#models/team/invoice_setting'
import r2StorageService from '#services/storage/r2_storage_service'

export default class InvoiceLogoUpload {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
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

    if (!logo.tmpPath) {
      return response.badRequest({ message: 'Fichier temporaire introuvable' })
    }

    const fileName = `${user.currentTeamId}-${randomUUID()}.${logo.extname}`
    const buffer = await readFile(logo.tmpPath)
    const contentType = logo.headers?.['content-type'] || 'image/png'

    const logoUrl = await r2StorageService.upload('invoice-logos', fileName, buffer, contentType)

    let settings = await InvoiceSetting.findBy('teamId', user.currentTeamId)

    if (!settings) {
      settings = await InvoiceSetting.create({
        teamId: user.currentTeamId,
        logoUrl,
      })
    } else {
      settings.logoUrl = logoUrl
      await settings.save()
    }

    return response.ok({
      message: 'Logo mis à jour',
      logoUrl,
    })
  }
}
