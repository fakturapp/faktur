import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import User from '#models/account/user'
import TokenService from '#services/auth/token_service'
import AuditLog from '#models/shared/audit_log'
import securityConfig from '#config/security'

export default class Verify {
  async handle({ request, response }: HttpContext) {
    const { token } = request.only(['token'])

    if (!token) {
      return response.badRequest({ message: 'Verification token is required' })
    }

    const tokenHash = TokenService.hashToken(token)

    const user = await User.findBy('emailVerificationToken', tokenHash)

    if (!user) {
      return response.badRequest({ message: 'Invalid or expired verification token' })
    }

    if (user.emailVerificationSentAt) {
      const expiresAt = user.emailVerificationSentAt.plus({
        seconds: securityConfig.tokens.emailVerificationExpiry,
      })
      if (DateTime.now() > expiresAt) {
        return response.badRequest({ message: 'Verification token has expired' })
      }
    }

    user.emailVerified = true
    user.emailVerificationToken = null
    user.emailVerificationSentAt = null
    await user.save()

    await AuditLog.create({
      userId: user.id,
      action: 'user.email_verified',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      severity: 'info',
    })

    return response.ok({ message: 'Email verified successfully' })
  }
}
