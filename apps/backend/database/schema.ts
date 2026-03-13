/**
 * Schema file — defines the base column types used by models.
 * This file is auto-referenced by models via the UserSchema export.
 * Run "node ace migration:run" to apply the actual PostgreSQL migrations.
 */

import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export class AuthAccessTokenSchema extends BaseModel {
  static $columns = ['abilities', 'createdAt', 'expiresAt', 'hash', 'id', 'lastUsedAt', 'name', 'tokenableId', 'type', 'updatedAt'] as const
  $columns = AuthAccessTokenSchema.$columns
  @column()
  declare abilities: string
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime | null
  @column.dateTime()
  declare expiresAt: DateTime | null
  @column()
  declare hash: string
  @column({ isPrimary: true })
  declare id: number
  @column.dateTime()
  declare lastUsedAt: DateTime | null
  @column()
  declare name: string | null
  @column()
  declare tokenableId: string
  @column()
  declare type: string
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
