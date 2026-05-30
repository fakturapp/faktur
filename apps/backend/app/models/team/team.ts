import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import User from '#models/account/user'
import TeamMember from '#models/team/team_member'
import Company from '#models/team/company'
import BankAccount from '#models/team/bank_account'
import EmailAccount from '#models/email/email_account'

export default class Team extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare iconUrl: string | null

  @column()
  declare ownerId: string

  @column()
  declare plan: 'free' | 'pro' | 'team'

  @column()
  declare stripeCustomerId: string | null

  @column()
  declare stripeSubscriptionId: string | null

  @column()
  declare subscriptionStatus: string | null

  @column()
  declare planPeriod: 'monthly' | 'annual' | null

  @column.dateTime()
  declare subscriptionCurrentPeriodEnd: DateTime | null

  @column.dateTime()
  declare subscriptionGraceEndsAt: DateTime | null

  @column()
  declare subscriptionCancelAtPeriodEnd: boolean

  @column()
  declare encryptionMode: 'private' | 'standard'

  @column.dateTime()
  declare encryptionModeConfirmedAt: DateTime | null

  @column.dateTime()
  declare onboardingCompletedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'ownerId' })
  declare owner: BelongsTo<typeof User>

  @hasMany(() => TeamMember)
  declare members: HasMany<typeof TeamMember>

  @hasOne(() => Company)
  declare company: HasOne<typeof Company>

  @hasMany(() => BankAccount)
  declare bankAccounts: HasMany<typeof BankAccount>

  @hasMany(() => EmailAccount)
  declare emailAccounts: HasMany<typeof EmailAccount>
}
