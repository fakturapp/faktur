import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Team from '#models/team/team'

export default class EmailLog extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare teamId: string

  @column()
  declare documentType: 'invoice' | 'quote'

  @column()
  declare documentId: string

  @column()
  declare documentNumber: string

  @column()
  declare fromEmail: string

  @column()
  declare toEmail: string

  @column()
  declare subject: string

  @column()
  declare body: string

  @column()
  declare status: 'draft' | 'sent' | 'error'

  @column()
  declare errorMessage: string | null

  @column()
  declare emailType: 'send' | 'reminder'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Team)
  declare team: BelongsTo<typeof Team>
}
