import type { HttpContext } from '@adonisjs/core/http'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import r2StorageService from '#services/storage/r2_storage_service'

export default class UploadAvatar {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!

    const avatar = request.file('avatar', {
      size: '2mb',
      extnames: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    })

    if (!avatar) {
      return response.badRequest({ message: 'Aucun fichier fourni' })
    }

    if (!avatar.isValid) {
      return response.badRequest({ message: avatar.errors[0]?.message || 'Fichier invalide' })
    }

    if (!avatar.tmpPath) {
      return response.badRequest({ message: 'Fichier temporaire introuvable' })
    }

    const fileName = `${user.id}-${randomUUID()}.${avatar.extname}`
    const buffer = await readFile(avatar.tmpPath)
    const contentType = avatar.headers?.['content-type'] || 'image/png'

    const avatarUrl = await r2StorageService.upload('avatars', fileName, buffer, contentType)
    user.avatarUrl = avatarUrl
    await user.save()

    return response.ok({
      message: 'Avatar mis à jour',
      avatarUrl,
    })
  }
}
