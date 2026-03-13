import type { HttpContext } from '@adonisjs/core/http'

export default class SearchSiren {
  async handle({ request, response }: HttpContext) {
    const query = request.input('q', '').trim()

    if (!query || query.length < 3) {
      return response.ok({ results: [] })
    }

    try {
      // Use the free French government API (entreprise.data.gouv.fr)
      const searchUrl = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&page=1&per_page=10`

      const res = await fetch(searchUrl)

      if (!res.ok) {
        return response.ok({ results: [] })
      }

      const data = await res.json()

      const results = (data.results || []).map((item: any) => ({
        siren: item.siren || '',
        siret: item.siege?.siret || '',
        companyName: item.nom_complet || item.nom_raison_sociale || '',
        legalForm: item.nature_juridique || '',
        address: item.siege?.adresse || '',
        postalCode: item.siege?.code_postal || '',
        city: item.siege?.libelle_commune || '',
        vatNumber: item.siren ? `FR${(12 + 3 * (Number.parseInt(item.siren) % 97)) % 97}${item.siren}` : '',
      }))

      return response.ok({ results })
    } catch {
      return response.ok({ results: [] })
    }
  }
}
