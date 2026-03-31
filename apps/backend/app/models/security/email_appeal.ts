import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class EmailAppeal extends BaseModel {
  static table = 'email_appeals'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare email: string

  @column()
  declare domain: string

  @column()
  declare reason: string

  @column()
  declare status: 'pending' | 'approved' | 'rejected'

  @column()
  declare adminNote: string | null

  @column()
  declare ipAddress: string | null

  @column.dateTime()
  declare reviewedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
