import type Client from '#models/client/client'
import publicIdCodec from '#services/api/public_id_codec'

export interface ApiClientShape {
  id: string
  type: 'company' | 'individual'
  civility: 'mr' | 'mme' | null
  display_name: string
  company_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  siren: string | null
  siret: string | null
  vat_number: string | null
  address: string | null
  address_complement: string | null
  postal_code: string | null
  city: string | null
  country: string
  include_in_emails: boolean
  notes: string | null
  created_at: string
  updated_at: string | null
}

class ApiClientTransformer {
  transform(client: Client): ApiClientShape {
    return {
      id: publicIdCodec.encode('client', client.id),
      type: client.type,
      civility: client.civility,
      display_name: client.displayName,
      company_name: client.companyName,
      first_name: client.firstName,
      last_name: client.lastName,
      email: client.email,
      phone: client.phone,
      siren: client.siren,
      siret: client.siret,
      vat_number: client.vatNumber,
      address: client.address,
      address_complement: client.addressComplement,
      postal_code: client.postalCode,
      city: client.city,
      country: client.country,
      include_in_emails: client.includeInEmails,
      notes: client.notes,
      created_at: client.createdAt.toISO() ?? '',
      updated_at: client.updatedAt?.toISO() ?? null,
    }
  }

  transformMany(clients: Client[]): ApiClientShape[] {
    return clients.map((c) => this.transform(c))
  }
}

export default new ApiClientTransformer()
