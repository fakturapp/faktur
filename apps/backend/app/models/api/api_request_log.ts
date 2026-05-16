import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ApiKey from '#models/api/api_key'

export default class ApiRequestLog extends BaseModel {
  public static table = 'api_request_logs'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare apiKeyId: string

  @column()
  declare method: string

  @column()
  declare path: string

  @column()
  declare status: number

  @column()
  declare latencyMs: number

  @column()
  declare ip: string

  @column()
  declare requestId: string

  @column()
  declare errorCode: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => ApiKey, { foreignKey: 'apiKeyId' })
  declare apiKey: BelongsTo<typeof ApiKey>
}
