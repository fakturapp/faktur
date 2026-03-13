import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import LoginHistory from '#models/account/login_history'
import AuditLog from '#models/shared/audit_log'
import Team from '#models/team/team'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare avatarUrl: string | null

  // Email Verification
  @column()
  declare emailVerified: boolean

  @column({ serializeAs: null })
  declare emailVerificationToken: string | null

  @column.dateTime()
  declare emailVerificationSentAt: DateTime | null

  // 2FA
  @column()
  declare twoFactorEnabled: boolean

  @column({ serializeAs: null })
  declare twoFactorSecretEncrypted: string | null

  @column({ serializeAs: null })
  declare recoveryCodesEncrypted: string | null

  // Security
  @column({ serializeAs: null })
  declare passwordResetToken: string | null

  @column.dateTime()
  declare passwordResetExpiresAt: DateTime | null

  @column()
  declare failedLoginAttempts: number

  @column.dateTime()
  declare lockedUntil: DateTime | null

  // Security Verification
  @column({ serializeAs: null })
  declare securityCode: string | null

  @column.dateTime()
  declare securityCodeExpiresAt: DateTime | null

  // Team & Onboarding
  @column()
  declare currentTeamId: string | null

  @column()
  declare onboardingCompleted: boolean

  // Status
  @column()
  declare status: 'active' | 'suspended' | 'deleted'

  @column.dateTime()
  declare lastLoginAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relations
  @belongsTo(() => Team, { foreignKey: 'currentTeamId' })
  declare currentTeam: BelongsTo<typeof Team>

  @hasMany(() => LoginHistory)
  declare loginHistories: HasMany<typeof LoginHistory>

  @hasMany(() => AuditLog)
  declare auditLogs: HasMany<typeof AuditLog>

  static accessTokens = DbAccessTokensProvider.forModel(User)

  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }
}
