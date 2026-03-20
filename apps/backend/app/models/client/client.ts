import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Team from '#models/team/team'
import ClientContact from '#models/client/client_contact'

export default class Client extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare teamId: string

  @column()
  declare type: 'company' | 'individual'

  // Company fields
  @column()
  declare companyName: string | null

  @column()
  declare siren: string | null

  @column()
  declare siret: string | null

  @column()
  declare vatNumber: string | null

  // Individual fields
  @column()
  declare firstName: string | null

  @column()
  declare lastName: string | null

  // Contact
  @column()
  declare email: string | null

  @column()
  declare phone: string | null

  @column()
  declare includeInEmails: boolean

  // Address
  @column()
  declare address: string | null

  @column()
  declare addressComplement: string | null

  @column()
  declare postalCode: string | null

  @column()
  declare city: string | null

  @column()
  declare country: string

  // Notes
  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Team)
  declare team: BelongsTo<typeof Team>

  @hasMany(() => ClientContact)
  declare contacts: HasMany<typeof ClientContact>

  get displayName(): string {
    if (this.type === 'company') {
      return this.companyName || ''
    }
    return `${this.firstName || ''} ${this.lastName || ''}`.trim()
  }
}
