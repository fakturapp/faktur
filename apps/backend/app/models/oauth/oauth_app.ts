import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/account/user'

export default class OauthApp extends BaseModel {
  public static table = 'oauth_apps'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare iconUrl: string | null

  @column()
  declare websiteUrl: string | null

  @column()
  declare clientId: string

  @column({ serializeAs: null })
  declare clientSecretHash: string

  @column()
  declare redirectUris: string[]

  @column()
  declare scopes: string[]

  @column()
  declare webhookUrl: string | null

  @column({ serializeAs: null })
  declare encryptedWebhookSecret: string | null

  @column()
  declare webhookEvents: string[] | null

  @column()
  declare kind: 'desktop' | 'web' | 'cli'

  @column()
  declare createdByUserId: string

  @column()
  declare isActive: boolean

  @column()
  declare isFirstParty: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'createdByUserId' })
  declare createdBy: BelongsTo<typeof User>

  isRedirectUriAllowed(raw: string): boolean {
    return this.redirectUris.includes(raw)
  }

  subscribesTo(eventType: string): boolean {
    if (!this.webhookUrl) return false
    if (!this.webhookEvents || this.webhookEvents.length === 0) return false
    return this.webhookEvents.includes(eventType)
  }
}
