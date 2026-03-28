import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/account/user'

export default class AnalyticsSession extends BaseModel {
  static table = 'analytics_sessions'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string | null

  @column()
  declare sessionToken: string

  @column.dateTime()
  declare startedAt: DateTime

  @column.dateTime()
  declare endedAt: DateTime | null

  @column()
  declare durationSeconds: number

  @column()
  declare pageCount: number

  @column()
  declare eventCount: number

  @column()
  declare entryPage: string | null

  @column()
  declare exitPage: string | null

  @column()
  declare referrerEncrypted: string | null

  @column()
  declare ipAddressEncrypted: string | null

  @column()
  declare ipHash: string

  @column()
  declare userAgentEncrypted: string | null

  @column()
  declare browser: string | null

  @column()
  declare browserVersion: string | null

  @column()
  declare os: string | null

  @column()
  declare deviceType: string | null

  @column()
  declare screenWidth: number | null

  @column()
  declare screenHeight: number | null

  @column()
  declare country: string | null

  @column()
  declare countryNameEncrypted: string | null

  @column()
  declare cityEncrypted: string | null

  @column()
  declare language: string | null

  @column()
  declare isAuthenticated: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
