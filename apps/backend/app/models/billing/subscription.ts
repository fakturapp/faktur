import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/account/user'

export default class Subscription extends BaseModel {
  static table = 'subscriptions'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare stripeCustomerId: string | null

  @column()
  declare stripeSubscriptionId: string | null

  @column()
  declare planName: string

  @column()
  declare status: string

  @column.dateTime()
  declare currentPeriodStart: DateTime | null

  @column.dateTime()
  declare currentPeriodEnd: DateTime | null

  @column()
  declare cancelAtPeriodEnd: boolean

  @column.dateTime()
  declare canceledAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
