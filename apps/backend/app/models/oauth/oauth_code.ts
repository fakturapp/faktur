import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/account/user'
import OauthApp from '#models/oauth/oauth_app'

export default class OauthCode extends BaseModel {
  public static table = 'oauth_codes'

  @column({ isPrimary: true })
  declare id: string

  @column({ serializeAs: null })
  declare codeHash: string

  @column()
  declare oauthAppId: string

  @column()
  declare userId: string

  @column()
  declare redirectUri: string

  @column()
  declare scopes: string[]

  @column()
  declare codeChallenge: string | null

  @column()
  declare codeChallengeMethod: string | null

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime()
  declare usedAt: DateTime | null

  @column()
  declare clientIp: string | null

  @column()
  declare userAgent: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => OauthApp, { foreignKey: 'oauthAppId' })
  declare app: BelongsTo<typeof OauthApp>

  get isExpired(): boolean {
    return DateTime.now() > this.expiresAt
  }

  get isUsed(): boolean {
    return this.usedAt !== null
  }

  get isRedeemable(): boolean {
    return !this.isExpired && !this.isUsed
  }
}
