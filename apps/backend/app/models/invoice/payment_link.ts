import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Team from '#models/team/team'
import Invoice from '#models/invoice/invoice'
import User from '#models/account/user'

export default class PaymentLink extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare teamId: string

  @column()
  declare invoiceId: string

  @column()
  declare createdByUserId: string

  @column()
  declare tokenHash: string

  @column()
  declare paymentMethod: string

  @column()
  declare paymentType: string

  @column()
  declare showIban: boolean

  @column()
  declare passwordHash: string | null

  @column()
  declare expirationType: string | null

  @column.dateTime()
  declare expiresAt: DateTime | null

  @column()
  declare isActive: boolean

  @column()
  declare encryptedIban: string | null

  @column()
  declare encryptedBic: string | null

  @column()
  declare encryptedBankName: string | null

  @column()
  declare clientEmail: string | null

  @column()
  declare clientName: string | null

  @column()
  declare amount: number

  @column()
  declare currency: string

  @column()
  declare invoiceNumber: string

  @column()
  declare companyName: string | null

  @column()
  declare pdfStorageKey: string | null

  @column()
  declare pdfData: Buffer | null

  @column.dateTime()
  declare paidAt: DateTime | null

  @column.dateTime()
  declare confirmedAt: DateTime | null

  @column()
  declare confirmedByUserId: string | null

  @column()
  declare confirmationDate: string | null

  @column()
  declare confirmationNotes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Team)
  declare team: BelongsTo<typeof Team>

  @belongsTo(() => Invoice)
  declare invoice: BelongsTo<typeof Invoice>

  @belongsTo(() => User, { foreignKey: 'createdByUserId' })
  declare createdBy: BelongsTo<typeof User>

  get isExpired(): boolean {
    if (!this.expiresAt) return false
    return DateTime.now() > this.expiresAt
  }

  get isValid(): boolean {
    return this.isActive && !this.isExpired
  }
}
