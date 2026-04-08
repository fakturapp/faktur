import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Team from '#models/team/team'
import Client from '#models/client/client'
import BankAccount from '#models/team/bank_account'
import RecurringInvoiceLine from '#models/recurring_invoice/recurring_invoice_line'

export default class RecurringInvoice extends BaseModel {
  static table = 'recurring_invoices'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare teamId: string

  @column()
  declare clientId: string | null

  @column()
  declare name: string

  @column()
  declare frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'

  @column()
  declare customIntervalDays: number | null

  @column()
  declare startDate: string

  @column()
  declare nextExecutionDate: string

  @column()
  declare endDate: string | null

  @column()
  declare isActive: boolean

  @column.dateTime()
  declare lastGeneratedAt: DateTime | null

  @column()
  declare generationCount: number

  @column()
  declare subject: string | null

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
  declare paymentTerms: string | null

  @column()
  declare paymentMethod: string | null

  @column()
  declare bankAccountId: string | null

  @column()
  declare vatExemptReason: 'none' | 'not_subject' | 'france_no_vat' | 'outside_france'

  @column()
  declare operationCategory: 'service' | 'goods' | 'mixed' | null

  @column()
  declare dueDays: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Team)
  declare team: BelongsTo<typeof Team>

  @belongsTo(() => Client)
  declare client: BelongsTo<typeof Client>

  @belongsTo(() => BankAccount)
  declare bankAccount: BelongsTo<typeof BankAccount>

  @hasMany(() => RecurringInvoiceLine)
  declare lines: HasMany<typeof RecurringInvoiceLine>
}
