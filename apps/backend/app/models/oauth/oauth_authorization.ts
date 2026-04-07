import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/account/user'
import OauthApp from '#models/oauth/oauth_app'

export default class OauthAuthorization extends BaseModel {
  public static table = 'oauth_authorizations'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare oauthAppId: string

  @column()
  declare scopes: string[]

  @column.dateTime()
  declare firstAuthorizedAt: DateTime

  @column.dateTime()
  declare lastAuthorizedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => OauthApp, { foreignKey: 'oauthAppId' })
  declare app: BelongsTo<typeof OauthApp>
}
