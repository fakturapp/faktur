import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

export default class ServeAvatar {
  async handle({ params, response }: HttpContext) {
    const filePath = join(app.tmpPath(), 'uploads', 'avatars', params.filename)

    if (!existsSync(filePath)) {
      return response.notFound({ message: 'Avatar non trouvé' })
    }

    return response.download(filePath)
  }
}
