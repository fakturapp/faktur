import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Team from '#models/team/team'

export default class InvoiceSetting extends BaseModel {
  static table = 'invoice_settings'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare teamId: string

  @column()
  declare billingType: 'quick' | 'detailed'

  @column()
  declare accentColor: string

  @column()
  declare logoUrl: string | null

  @column()
  declare logoSource: 'custom' | 'company'

  @column({
    prepare: (value: string[]) => JSON.stringify(value),
    consume: (value: string | string[]) => (typeof value === 'string' ? JSON.parse(value) : value),
  })
  declare paymentMethods: string[]

  @column()
  declare customPaymentMethod: string | null

  @column()
  declare template: string

  @column()
  declare darkMode: boolean

  @column()
  declare documentFont: string

  @column()
  declare eInvoicingEnabled: boolean

  @column()
  declare pdpProvider: 'b2brouter' | 'sandbox' | null

  @column()
  declare pdpApiKey: string | null

  @column()
  declare pdpSandbox: boolean

  @column()
  declare defaultOperationCategory: 'service' | 'goods' | 'mixed' | null

  @column()
  declare defaultSubject: string | null

  @column()
  declare defaultAcceptanceConditions: string | null

  @column()
  declare defaultSignatureField: boolean

  @column()
  declare defaultFreeField: string | null

  @column()
  declare defaultShowNotes: boolean

  @column()
  declare defaultVatExempt: boolean

  @column()
  declare defaultFooterText: string | null

  @column()
  declare defaultShowDeliveryAddress: boolean

  @column()
  declare defaultLanguage: string

  @column()
  declare quoteFilenamePattern: string

  @column()
  declare invoiceFilenamePattern: string

  @column()
  declare footerMode: 'company_info' | 'custom' | 'vat_exempt'

  @column()
  declare logoBorderRadius: number

  @column()
  declare nextInvoiceNumber: string | null

  @column()
  declare nextQuoteNumber: string | null

  @column()
  declare stripePublishableKey: string | null

  @column()
  declare stripeSecretKey: string | null

  @column()
  declare stripeWebhookSecret: string | null

  @column()
  declare stripeWebhookSecretApp: string | null

  @column()
  declare collaborationEnabled: boolean

  @column()
  declare aiEnabled: boolean

  @column()
  declare aiProvider: string

  @column()
  declare aiModel: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Team)
  declare team: BelongsTo<typeof Team>
}
