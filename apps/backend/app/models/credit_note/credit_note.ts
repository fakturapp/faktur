import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Team from '#models/team/team'
import Client from '#models/client/client'
import Invoice from '#models/invoice/invoice'
import CreditNoteLine from '#models/credit_note/credit_note_line'

export default class CreditNote extends BaseModel {
  static table = 'credit_notes'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare teamId: string

  @column()
  declare clientId: string | null

  @column()
  declare sourceInvoiceId: string | null

  @column()
  declare creditNoteNumber: string

  @column()
  declare status: 'draft' | 'sent' | 'finalized'

  @column()
  declare reason: string | null

  @column()
  declare subject: string | null

  @column()
  declare issueDate: string

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
  declare comment: string | null

  @column()
  declare vatExemptReason: 'none' | 'not_subject' | 'france_no_vat' | 'outside_france'

  @column()
  declare operationCategory: 'service' | 'goods' | 'mixed' | null

  @column()
  declare clientSnapshot: string | null

  @column()
  declare companySnapshot: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Team)
  declare team: BelongsTo<typeof Team>

  @belongsTo(() => Client)
  declare client: BelongsTo<typeof Client>

  @belongsTo(() => Invoice, { foreignKey: 'sourceInvoiceId' })
  declare sourceInvoice: BelongsTo<typeof Invoice>

  @hasMany(() => CreditNoteLine)
  declare lines: HasMany<typeof CreditNoteLine>
}
