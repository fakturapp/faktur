import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

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

    const uploadsDir = join(app.tmpPath(), 'uploads', 'avatars')
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true })
    }

    const fileName = `${user.id}-${randomUUID()}.${avatar.extname}`
    await avatar.move(uploadsDir, { name: fileName, overwrite: true })

    const avatarUrl = `/avatars/${fileName}`
    user.avatarUrl = avatarUrl
    await user.save()

    return response.ok({
      message: 'Avatar mis à jour',
      avatarUrl,
    })
  }
}
