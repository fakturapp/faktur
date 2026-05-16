import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ApiKey from '#models/api/api_key'

export default class ApiIdempotencyKey extends BaseModel {
  public static table = 'api_idempotency_keys'
  public static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare key: string

  @column()
  declare apiKeyId: string

  @column()
  declare method: string

  @column()
  declare path: string

  @column({ serializeAs: null })
  declare bodyHash: string

  @column()
  declare responseStatus: number

  @column()
  declare responseBody: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime()
  declare expiresAt: DateTime

  @belongsTo(() => ApiKey, { foreignKey: 'apiKeyId' })
  declare apiKey: BelongsTo<typeof ApiKey>

  get isExpired(): boolean {
    return DateTime.now() > this.expiresAt
  }
}
