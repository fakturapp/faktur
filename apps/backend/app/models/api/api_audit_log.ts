import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Team from '#models/team/team'
import User from '#models/account/user'
import ApiProject from '#models/api/api_project'

export type AuditAction =
  | 'project.created'
  | 'project.updated'
  | 'project.archived'
  | 'project.unarchived'
  | 'project.deleted'
  | 'api_key.created'
  | 'api_key.rotated'
  | 'api_key.updated'
  | 'api_key.revoked'
  | 'webhook.configured'
  | 'webhook.updated'
  | 'webhook.deleted'
  | 'webhook.secret_rotated'
  | 'webhook.tested'

export type AuditTargetType = 'project' | 'api_key' | 'webhook' | 'team'

export default class ApiAuditLog extends BaseModel {
  public static table = 'api_audit_logs'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare teamId: string

  @column()
  declare projectId: string | null

  @column()
  declare actorUserId: string | null

  @column()
  declare actorEmail: string | null

  @column()
  declare actorName: string | null

  @column()
  declare action: AuditAction

  @column()
  declare targetType: AuditTargetType

  @column()
  declare targetId: string | null

  @column()
  declare targetLabel: string | null

  @column({
    prepare: (v: Record<string, unknown>) => JSON.stringify(v ?? {}),
    consume: (v: unknown) => (typeof v === 'string' ? JSON.parse(v) : (v ?? {})),
  })
  declare metadata: Record<string, unknown>

  @column()
  declare ip: string | null

  @column()
  declare userAgent: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Team, { foreignKey: 'teamId' })
  declare team: BelongsTo<typeof Team>

  @belongsTo(() => User, { foreignKey: 'actorUserId' })
  declare actor: BelongsTo<typeof User>

  @belongsTo(() => ApiProject, { foreignKey: 'projectId' })
  declare project: BelongsTo<typeof ApiProject>
}
