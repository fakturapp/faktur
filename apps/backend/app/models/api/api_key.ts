import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasOne, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne, HasMany } from '@adonisjs/lucid/types/relations'
import Team from '#models/team/team'
import User from '#models/account/user'
import ApiKeyWebhook from '#models/api/api_key_webhook'
import ApiWebhookDelivery from '#models/api/api_webhook_delivery'
import ApiRequestLog from '#models/api/api_request_log'

export default class ApiKey extends BaseModel {
  public static table = 'api_keys'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare teamId: string

  @column()
  declare createdByUserId: string | null

  @column()
  declare name: string

  @column()
  declare prefix: string

  @column()
  declare last4: string

  @column({ serializeAs: null })
  declare hash: string

  @column()
  declare scopes: string[]

  @column()
  declare rateLimitTier: string

  @column()
  declare allowedIps: string[] | null

  @column.dateTime()
  declare expiresAt: DateTime | null

  @column.dateTime()
  declare lastUsedAt: DateTime | null

  @column()
  declare lastIp: string | null

  @column()
  declare usageCount: number

  @column.dateTime()
  declare revokedAt: DateTime | null

  @column()
  declare revokedReason: string | null

  @column()
  declare rotatingToId: string | null

  @column.dateTime()
  declare rotationGraceUntil: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Team, { foreignKey: 'teamId' })
  declare team: BelongsTo<typeof Team>

  @belongsTo(() => User, { foreignKey: 'createdByUserId' })
  declare createdBy: BelongsTo<typeof User>

  @hasOne(() => ApiKeyWebhook, { foreignKey: 'apiKeyId' })
  declare webhook: HasOne<typeof ApiKeyWebhook>

  @hasMany(() => ApiWebhookDelivery, { foreignKey: 'apiKeyId' })
  declare deliveries: HasMany<typeof ApiWebhookDelivery>

  @hasMany(() => ApiRequestLog, { foreignKey: 'apiKeyId' })
  declare requestLogs: HasMany<typeof ApiRequestLog>

  get isExpired(): boolean {
    return this.expiresAt !== null && DateTime.now() > this.expiresAt
  }

  get isRevoked(): boolean {
    return this.revokedAt !== null
  }

  get isInRotationGrace(): boolean {
    return this.rotationGraceUntil !== null && DateTime.now() < this.rotationGraceUntil
  }

  get isUsable(): boolean {
    return !this.isExpired && !this.isRevoked
  }

  get publicId(): string {
    return `apk_${this.id}`
  }
}
