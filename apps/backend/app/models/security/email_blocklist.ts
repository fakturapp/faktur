import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class EmailBlocklist extends BaseModel {
  static table = 'email_blocklist'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare domain: string

  @column()
  declare action: 'block' | 'allow'

  @column()
  declare reason: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
