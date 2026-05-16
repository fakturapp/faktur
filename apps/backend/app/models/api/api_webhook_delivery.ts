import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ApiKey from '#models/api/api_key'

export type DeliveryStatus =
  | 'pending'
  | 'in_flight'
  | 'delivered'
  | 'failed'
  | 'failed_permanent'

export default class ApiWebhookDelivery extends BaseModel {
  public static table = 'api_webhook_deliveries'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare apiKeyId: string

  @column()
  declare eventType: string

  @column()
  declare eventId: string

  @column()
  declare url: string

  @column({ serializeAs: null })
  declare encryptedPayload: string

  @column()
  declare status: DeliveryStatus

  @column()
  declare attemptCount: number

  @column()
  declare lastStatusCode: number | null

  @column()
  declare lastError: string | null

  @column.dateTime()
  declare deliveredAt: DateTime | null

  @column.dateTime()
  declare nextAttemptAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => ApiKey, { foreignKey: 'apiKeyId' })
  declare apiKey: BelongsTo<typeof ApiKey>

  get publicId(): string {
    return `whd_${this.id}`
  }
}
