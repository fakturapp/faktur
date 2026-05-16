import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ApiKey from '#models/api/api_key'

export default class ApiKeyWebhook extends BaseModel {
  public static table = 'api_key_webhooks'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare apiKeyId: string

  @column()
  declare url: string

  @column({ serializeAs: null })
  declare secretHash: string

  @column()
  declare secretLast4: string

  @column()
  declare events: string[]

  @column()
  declare isActive: boolean

  @column.dateTime()
  declare lastDeliveryAt: DateTime | null

  @column()
  declare lastDeliveryStatus: string | null

  @column()
  declare consecutiveFailures: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => ApiKey, { foreignKey: 'apiKeyId' })
  declare apiKey: BelongsTo<typeof ApiKey>
}
