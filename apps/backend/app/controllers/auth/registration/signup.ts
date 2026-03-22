import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import User from '#models/account/user'
import { registerValidator } from '#validators/auth/auth_validators'
import TokenService from '#services/auth/token_service'
import VerifyEmailNotification from '#mails/verify_email_notification'
import AuditLog from '#models/shared/audit_log'
import TurnstileService from '#services/security/turnstile_service'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'

export default class Signup {
  async handle({ request, response }: HttpContext) {
    const data = await request.validateUsing(registerValidator)

    // Verify Turnstile captcha
    const turnstileValid = await TurnstileService.verifyToken(data.turnstileToken || '', request.ip())
    if (!turnstileValid) {
      return response.forbidden({ message: 'Captcha verification failed' })
    }

    const saltKdf = zeroAccessCryptoService.generateSalt()

    const user = await User.create({
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      emailVerified: false,
      twoFactorEnabled: false,
      status: 'active',
      failedLoginAttempts: 0,
      saltKdf: saltKdf.toString('hex'),
      keyVersion: 1,
    })

    const { token, hash: tokenHash } = TokenService.generateEmailVerificationToken()

    user.emailVerificationToken = tokenHash
    user.emailVerificationSentAt = DateTime.now()
    await user.save()

    await AuditLog.create({
      userId: user.id,
      action: 'user.registered',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      severity: 'info',
    })

    mail.sendLater(new VerifyEmailNotification(user.email, token, user.fullName ?? undefined))

    return response.created({
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    })
  }
}
