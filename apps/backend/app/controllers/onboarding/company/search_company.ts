import type { HttpContext } from '@adonisjs/core/http'
import SirenService from '#services/business/siren_service'

export default class SearchCompany {
  async handle({ request, response }: HttpContext) {
    const query = request.input('q', '')

    if (!query || query.length < 2) {
      return response.badRequest({ message: 'Query must be at least 2 characters' })
    }

    const isNumeric = /^\d+$/.test(query)

    if (isNumeric && query.length === 9) {
      const result = await SirenService.searchBySiren(query)
      return response.ok({ results: result ? [result] : [] })
    }

    if (isNumeric && query.length === 14) {
      const result = await SirenService.searchBySiret(query)
      return response.ok({ results: result ? [result] : [] })
    }

    const results = await SirenService.searchByName(query)
    return response.ok({ results })
  }
}
