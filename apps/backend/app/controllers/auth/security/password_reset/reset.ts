import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import User from '#models/account/user'
import TokenService from '#services/auth/token_service'
import AuditLog from '#models/shared/audit_log'
import { passwordResetValidator } from '#validators/auth/auth_validators'

export default class Reset {
  async handle({ request, response }: HttpContext) {
    const data = await request.validateUsing(passwordResetValidator)

    const tokenHash = TokenService.hashToken(data.token)

    const user = await User.findBy('passwordResetToken', tokenHash)

    if (!user) {
      return response.badRequest({ message: 'Invalid or expired reset token' })
    }

    if (user.passwordResetExpiresAt && DateTime.now() > user.passwordResetExpiresAt) {
      return response.badRequest({ message: 'Reset token has expired' })
    }

    user.password = data.password
    user.passwordResetToken = null
    user.passwordResetExpiresAt = null
    user.failedLoginAttempts = 0
    user.lockedUntil = null
    await user.save()

    await AuditLog.create({
      userId: user.id,
      action: 'user.password_reset',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      severity: 'warning',
    })

    return response.ok({ message: 'Password reset successfully' })
  }
}
