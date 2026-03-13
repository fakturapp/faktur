import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Quote from '#models/quote/quote'

export default class QuoteLine extends BaseModel {
  static table = 'quote_lines'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare quoteId: string

  @column()
  declare position: number

  @column()
  declare description: string

  @column()
  declare saleType: string | null

  @column()
  declare quantity: number

  @column()
  declare unit: string | null

  @column()
  declare unitPrice: number

  @column()
  declare vatRate: number

  @column()
  declare total: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Quote)
  declare quote: BelongsTo<typeof Quote>
}
