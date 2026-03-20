import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Team from '#models/team/team'
import Client from '#models/client/client'

export default class ClientContact extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare clientId: string

  @column()
  declare teamId: string

  @column()
  declare firstName: string | null

  @column()
  declare lastName: string | null

  @column()
  declare email: string | null

  @column()
  declare phone: string | null

  @column()
  declare role: string | null

  @column()
  declare notes: string | null

  @column()
  declare isPrimary: boolean

  @column()
  declare includeInEmails: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Team)
  declare team: BelongsTo<typeof Team>

  @belongsTo(() => Client)
  declare client: BelongsTo<typeof Client>
}
