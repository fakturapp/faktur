import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/account/user'
import AnalyticsSession from '#models/analytics/analytics_session'

export default class AnalyticsError extends BaseModel {
  static table = 'analytics_errors'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare sessionId: string | null

  @column()
  declare userId: string | null

  @column()
  declare errorType: string

  @column()
  declare errorMessage: string

  @column()
  declare errorMessageFullEncrypted: string | null

  @column()
  declare stackTraceEncrypted: string | null

  @column()
  declare pagePath: string

  @column()
  declare browser: string | null

  @column()
  declare os: string | null

  @column()
  declare occurrenceCount: number

  @column()
  declare fingerprint: string

  @column()
  declare isResolved: boolean

  @column.dateTime()
  declare timestamp: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => AnalyticsSession)
  declare session: BelongsTo<typeof AnalyticsSession>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
