import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import OauthApp from '#models/oauth/oauth_app'

export type WebhookStatus = 'pending' | 'delivered' | 'failed' | 'dead'

export default class OauthWebhookDelivery extends BaseModel {
  public static table = 'oauth_webhook_deliveries'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare oauthAppId: string

  @column()
  declare eventType: string

  @column()
  declare eventId: string

  @column()
  declare url: string

  @column({ serializeAs: null })
  declare encryptedPayload: string

  @column()
  declare status: WebhookStatus

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

  @belongsTo(() => OauthApp, { foreignKey: 'oauthAppId' })
  declare app: BelongsTo<typeof OauthApp>
}
