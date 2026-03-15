import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

export default class ServeLogo {
  async handle({ params, response }: HttpContext) {
    const filePath = join(app.tmpPath(), 'uploads', 'company-logos', params.filename)

    if (!existsSync(filePath)) {
      return response.notFound({ message: 'Logo non trouvé' })
    }

    return response.download(filePath)
  }
}
