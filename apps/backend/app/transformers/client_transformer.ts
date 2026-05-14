import type Client from '#models/client/client'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ClientTransformer extends BaseTransformer<Client> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'type',
      'civility',
      'displayName',
      'companyName',
      'firstName',
      'lastName',
      'email',
      'phone',
      'address',
      'addressComplement',
      'postalCode',
      'city',
      'country',
      'siren',
      'siret',
      'vatNumber',
      'notes',
      'includeInEmails',
      'createdAt',
    ])
  }
}
