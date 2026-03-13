import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/account/user'
import Team from '#models/team/team'

export default class TeamMember extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare teamId: string

  @column()
  declare userId: string

  @column()
  declare role: 'viewer' | 'member' | 'admin' | 'super_admin'

  @column()
  declare status: 'active' | 'pending' | 'inactive'

  @column()
  declare invitationToken: string | null

  @column()
  declare invitedEmail: string | null

  @column.dateTime()
  declare invitedAt: DateTime | null

  @column.dateTime()
  declare joinedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Team)
  declare team: BelongsTo<typeof Team>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
