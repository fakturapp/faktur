import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/account/user'
import AnalyticsSession from '#models/analytics/analytics_session'

export default class AnalyticsPerformance extends BaseModel {
  static table = 'analytics_performance'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare sessionId: string | null

  @column()
  declare userId: string | null

  @column()
  declare metricName: string

  @column()
  declare metricValue: number

  @column()
  declare rating: string

  @column()
  declare pagePath: string

  @column()
  declare connectionType: string | null

  @column()
  declare deviceType: string | null

  @column.dateTime()
  declare timestamp: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => AnalyticsSession)
  declare session: BelongsTo<typeof AnalyticsSession>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
