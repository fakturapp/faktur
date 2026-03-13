interface SirenResult {
  siren: string
  siret: string | null
  legalName: string
  tradeName: string | null
  legalForm: string | null
  vatNumber: string | null
  addressLine1: string | null
  city: string | null
  postalCode: string | null
  country: string
}

export default class SirenService {
  private static BASE_URL = 'https://recherche-entreprises.api.gouv.fr'

  static async searchByName(query: string): Promise<SirenResult[]> {
    const res = await fetch(`${this.BASE_URL}/search?q=${encodeURIComponent(query)}&page=1&per_page=10`)
    if (!res.ok) return []
    const data = (await res.json()) as any
    return (data.results || []).map((r: any) => this.mapResult(r))
  }

  static async searchBySiren(siren: string): Promise<SirenResult | null> {
    const res = await fetch(`${this.BASE_URL}/search?q=${siren}&page=1&per_page=1`)
    if (!res.ok) return null
    const data = (await res.json()) as any
    const result = data.results?.[0]
    if (!result) return null
    return this.mapResult(result)
  }

  static async searchBySiret(siret: string): Promise<SirenResult | null> {
    const siren = siret.substring(0, 9)
    return this.searchBySiren(siren)
  }

  private static buildStreetAddress(siege: any): string | null {
    const parts: string[] = []

    if (siege.numero_voie) {
      parts.push(siege.numero_voie)
    }
    if (siege.indice_repetition) {
      parts.push(siege.indice_repetition)
    }
    if (siege.type_voie) {
      parts.push(siege.type_voie)
    }
    if (siege.libelle_voie) {
      parts.push(siege.libelle_voie)
    }

    if (parts.length > 0) {
      return parts.join(' ')
    }

    if (siege.complement_adresse) {
      return siege.complement_adresse
    }

    return null
  }

  private static mapResult(r: any): SirenResult {
    const siege = r.siege || {}
    const siren = r.siren || ''

    let vatNumber: string | null = null
    if (siren) {
      const sirenNum = Number.parseInt(siren, 10)
      const key = (12 + 3 * (sirenNum % 97)) % 97
      vatNumber = `FR${String(key).padStart(2, '0')}${siren}`
    }

    return {
      siren,
      siret: siege.siret || null,
      legalName: r.nom_complet || r.nom_raison_sociale || '',
      tradeName: r.nom_commercial || null,
      legalForm: r.nature_juridique || null,
      vatNumber,
      addressLine1: this.buildStreetAddress(siege),
      city: siege.libelle_commune || null,
      postalCode: siege.code_postal || null,
      country: 'FR',
    }
  }
}
