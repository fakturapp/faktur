import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ApiCreditUsage extends BaseModel {
  public static table = 'api_credit_usage'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare teamId: string

  @column()
  declare userId: string | null

  @column.date()
  declare day: DateTime

  @column.date()
  declare weekStart: DateTime

  @column()
  declare dailyCount: number

  @column()
  declare weeklyCount: number

  @column.dateTime()
  declare lastMinuteAt: DateTime | null

  @column()
  declare minuteCount: number

  @column.dateTime()
  declare sessionStartedAt: DateTime | null

  @column()
  declare sessionCount: number

  @column.dateTime()
  declare weeklyStartedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
