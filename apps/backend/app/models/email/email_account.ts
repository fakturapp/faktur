import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Team from '#models/team/team'

export default class EmailAccount extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare teamId: string

  @column()
  declare provider: 'gmail' | 'resend' | 'smtp'

  @column()
  declare email: string

  @column()
  declare displayName: string | null

  @column()
  declare accessToken: string | null

  @column()
  declare refreshToken: string | null

  @column.dateTime()
  declare tokenExpiresAt: DateTime | null

  @column()
  declare smtpHost: string | null

  @column()
  declare smtpPort: number | null

  @column()
  declare smtpUsername: string | null

  @column()
  declare smtpPassword: string | null

  @column()
  declare isDefault: boolean

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Team)
  declare team: BelongsTo<typeof Team>
}
