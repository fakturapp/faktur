import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Team from '#models/team/team'

export default class Company extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare teamId: string

  @column()
  declare legalName: string

  @column()
  declare tradeName: string | null

  @column()
  declare siren: string | null

  @column()
  declare siret: string | null

  @column()
  declare vatNumber: string | null

  @column()
  declare legalForm: string | null

  @column({ columnName: 'address_line1' })
  declare addressLine1: string | null

  @column({ columnName: 'address_line2' })
  declare addressLine2: string | null

  @column()
  declare city: string | null

  @column()
  declare postalCode: string | null

  @column()
  declare country: string

  @column()
  declare phone: string | null

  @column()
  declare email: string | null

  @column()
  declare website: string | null

  @column()
  declare logoUrl: string | null

  @column()
  declare iban: string | null

  @column()
  declare bic: string | null

  @column()
  declare bankName: string | null

  @column()
  declare paymentConditions: string | null

  @column()
  declare currency: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Team)
  declare team: BelongsTo<typeof Team>
}
