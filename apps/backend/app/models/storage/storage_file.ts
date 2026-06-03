import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Team from '#models/team/team'

export type StorageCategory =
  | 'company_logo'
  | 'invoice_logo'
  | 'team_icon'
  | 'payment_link_pdf'

export default class StorageFile extends BaseModel {
  static table = 'storage_files'
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare teamId: string

  @column()
  declare category: StorageCategory

  @column()
  declare objectKey: string

  @column()
  declare publicUrl: string

  @column()
  declare sizeBytes: number

  @column()
  declare contentType: string | null

  @column()
  declare originalName: string | null

  @column()
  declare isOrphaned: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Team)
  declare team: BelongsTo<typeof Team>
}
