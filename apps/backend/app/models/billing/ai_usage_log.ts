import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/account/user'
import Team from '#models/team/team'

export default class AiUsageLog extends BaseModel {
  static table = 'ai_usage_logs'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare teamId: string

  @column()
  declare action: string

  @column()
  declare provider: string

  @column()
  declare model: string

  @column()
  declare tokensUsed: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Team)
  declare team: BelongsTo<typeof Team>
}
