import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/account/user'

export default class LoginHistory extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string | null

  @column()
  declare tokenIdentifier: string | null

  @column()
  declare ipAddress: string

  @column()
  declare userAgent: string | null

  @column()
  declare country: string | null

  @column()
  declare city: string | null

  @column()
  declare status: 'success' | 'failed' | 'blocked'

  @column()
  declare failureReason: string | null

  @column()
  declare isSuspicious: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
