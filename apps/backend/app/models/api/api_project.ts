import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Team from '#models/team/team'
import User from '#models/account/user'
import ApiKey from '#models/api/api_key'

export default class ApiProject extends BaseModel {
  public static table = 'api_projects'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare teamId: string

  @column()
  declare createdByUserId: string | null

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare color: string | null

  @column()
  declare isDefault: boolean

  @column()
  declare isArchived: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Team, { foreignKey: 'teamId' })
  declare team: BelongsTo<typeof Team>

  @belongsTo(() => User, { foreignKey: 'createdByUserId' })
  declare createdBy: BelongsTo<typeof User>

  @hasMany(() => ApiKey, { foreignKey: 'projectId' })
  declare apiKeys: HasMany<typeof ApiKey>

  get publicId(): string {
    return `prj_${this.id}`
  }
}
