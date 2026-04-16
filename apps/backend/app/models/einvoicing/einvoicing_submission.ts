import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Team from '#models/team/team'
import User from '#models/account/user'

interface LifecycleEvent {
  status: string
  message: string
  timestamp: string
}

export default class EinvoicingSubmission extends BaseModel {
  static table = 'einvoicing_submissions'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare teamId: string

  @column()
  declare documentType: 'invoice' | 'quote' | 'credit_note'

  @column()
  declare documentId: string

  @column()
  declare documentNumber: string

  @column()
  declare provider: string

  @column()
  declare trackingId: string | null

  @column()
  declare externalId: string | null

  @column()
  declare status: 'pending' | 'submitted' | 'accepted' | 'rejected' | 'delivered' | 'error'

  @column()
  declare statusMessage: string | null

  @column({
    prepare: (value: LifecycleEvent[]) => JSON.stringify(value),
    consume: (value: string | LifecycleEvent[]) =>
      typeof value === 'string' ? JSON.parse(value) : value,
  })
  declare lifecycleEvents: LifecycleEvent[]

  @column()
  declare xmlContent: string | null

  @column()
  declare submittedByUserId: string | null

  @column.dateTime()
  declare submittedAt: DateTime | null

  @column.dateTime()
  declare lastCheckedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Team)
  declare team: BelongsTo<typeof Team>

  @belongsTo(() => User, { foreignKey: 'submittedByUserId' })
  declare submittedBy: BelongsTo<typeof User>

  addLifecycleEvent(status: string, message: string): void {
    const events = this.lifecycleEvents || []
    events.push({ status, message, timestamp: new Date().toISOString() })
    this.lifecycleEvents = events
  }
}
