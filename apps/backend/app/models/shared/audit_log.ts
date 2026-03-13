import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/account/user'

export default class AuditLog extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string | null

  @column()
  declare action: string

  @column()
  declare resourceType: string

  @column()
  declare resourceId: string | null

  @column()
  declare metadata: Record<string, unknown> | null

  @column()
  declare ipAddress: string | null

  @column()
  declare userAgent: string | null

  @column()
  declare severity: 'info' | 'warning' | 'critical'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
