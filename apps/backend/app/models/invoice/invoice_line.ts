import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Invoice from '#models/invoice/invoice'

export default class InvoiceLine extends BaseModel {
  static table = 'invoice_lines'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare invoiceId: string

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

  @belongsTo(() => Invoice)
  declare invoice: BelongsTo<typeof Invoice>
}
