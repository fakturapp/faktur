import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Team from '#models/team/team'
import Client from '#models/client/client'
import InvoiceLine from '#models/invoice/invoice_line'
import BankAccount from '#models/team/bank_account'

export default class Invoice extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare teamId: string

  @column()
  declare clientId: string | null

  @column()
  declare invoiceNumber: string

  @column()
  declare status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

  @column()
  declare subject: string | null

  @column()
  declare issueDate: string

  @column()
  declare dueDate: string | null

  @column()
  declare billingType: 'quick' | 'detailed'

  @column()
  declare accentColor: string

  @column()
  declare logoUrl: string | null

  @column()
  declare language: string

  @column()
  declare notes: string | null

  @column()
  declare acceptanceConditions: string | null

  @column()
  declare signatureField: boolean

  @column()
  declare documentTitle: string | null

  @column()
  declare freeField: string | null

  @column()
  declare globalDiscountType: 'none' | 'percentage' | 'fixed'

  @column()
  declare globalDiscountValue: number

  @column()
  declare deliveryAddress: string | null

  @column()
  declare clientSiren: string | null

  @column()
  declare clientVatNumber: string | null

  @column()
  declare subtotal: number

  @column()
  declare taxAmount: number

  @column()
  declare total: number

  @column()
  declare sourceQuoteId: string | null

  @column()
  declare paymentTerms: string | null

  @column()
  declare paidDate: string | null

  @column()
  declare comment: string | null

  @column()
  declare paymentMethod: string | null

  @column()
  declare bankAccountId: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Team)
  declare team: BelongsTo<typeof Team>

  @belongsTo(() => Client)
  declare client: BelongsTo<typeof Client>

  @hasMany(() => InvoiceLine)
  declare lines: HasMany<typeof InvoiceLine>

  @belongsTo(() => BankAccount)
  declare bankAccount: BelongsTo<typeof BankAccount>
}
