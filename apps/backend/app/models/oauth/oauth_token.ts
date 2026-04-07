import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/account/user'
import OauthApp from '#models/oauth/oauth_app'

export default class OauthToken extends BaseModel {
  public static table = 'oauth_tokens'

  @column({ isPrimary: true })
  declare id: string

  @column({ serializeAs: null })
  declare accessTokenHash: string

  @column({ serializeAs: null })
  declare refreshTokenHash: string

  @column()
  declare oauthAppId: string

  @column()
  declare userId: string

  @column()
  declare scopes: string[]

  @column()
  declare deviceName: string | null

  @column()
  declare devicePlatform: string | null

  @column()
  declare deviceOs: string | null

  @column()
  declare lastIp: string | null

  @column()
  declare lastUserAgent: string | null

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime()
  declare refreshExpiresAt: DateTime

  @column.dateTime()
  declare lastUsedAt: DateTime | null

  @column.dateTime()
  declare revokedAt: DateTime | null

  @column()
  declare revokedReason: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => OauthApp, { foreignKey: 'oauthAppId' })
  declare app: BelongsTo<typeof OauthApp>

  get isExpired(): boolean {
    return DateTime.now() > this.expiresAt
  }

  get isRefreshExpired(): boolean {
    return DateTime.now() > this.refreshExpiresAt
  }

  get isRevoked(): boolean {
    return this.revokedAt !== null
  }

  get isValid(): boolean {
    return !this.isExpired && !this.isRevoked
  }

  get isRefreshable(): boolean {
    return !this.isRefreshExpired && !this.isRevoked
  }
}
