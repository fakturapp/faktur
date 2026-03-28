import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/account/user'
import AnalyticsSession from '#models/analytics/analytics_session'

export default class AnalyticsEvent extends BaseModel {
  static table = 'analytics_events'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare sessionId: string

  @column()
  declare userId: string | null

  @column()
  declare eventType: string

  @column()
  declare eventName: string

  @column()
  declare pagePath: string

  @column()
  declare pagePathFullEncrypted: string | null

  @column()
  declare metadata: any | null

  @column()
  declare metadataEncrypted: string | null

  @column.dateTime()
  declare timestamp: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => AnalyticsSession)
  declare session: BelongsTo<typeof AnalyticsSession>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
