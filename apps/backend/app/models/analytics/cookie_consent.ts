import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/account/user'

export default class CookieConsent extends BaseModel {
  static table = 'cookie_consents'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string | null

  @column()
  declare visitorId: string

  @column()
  declare consentAnalytics: boolean

  @column()
  declare consentEssential: boolean

  @column()
  declare ipAddressEncrypted: string | null

  @column()
  declare userAgentEncrypted: string | null

  @column()
  declare action: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
