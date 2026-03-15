import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

export default class ServeIcon {
  async handle({ params, response }: HttpContext) {
    const filePath = join(app.tmpPath(), 'uploads', 'team-icons', params.filename)

    if (!existsSync(filePath)) {
      return response.notFound({ message: 'Icon non trouvé' })
    }

    return response.download(filePath)
  }
}
