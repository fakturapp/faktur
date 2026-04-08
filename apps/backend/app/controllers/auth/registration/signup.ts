import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import User from '#models/account/user'
import { registerValidator } from '#validators/auth/auth_validators'
import TokenService from '#services/auth/token_service'
import UserRegistered from '#events/user_registered'
import AuditLog from '#models/shared/audit_log'
import TurnstileService from '#services/security/turnstile_service'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import UserTransformer from '#transformers/user_transformer'
import EmailBlacklistService from '#services/security/email_blacklist_service'

export default class Signup {
  async handle(ctx: HttpContext) {
    const { request, response } = ctx
    const data = await request.validateUsing(registerValidator)

    const isDisposable = await EmailBlacklistService.isDisposableEmail(data.email)
    if (isDisposable) {
      return response.unprocessableEntity({
        message: 'Les adresses email temporaires ne sont pas autorisées. Veuillez utiliser une adresse email permanente ou contacter support@fakturapp.cc pour faire whitelister votre domaine.',
        code: 'DISPOSABLE_EMAIL',
      })
    }

    const turnstileValid = await TurnstileService.verifyToken(
      data.turnstileToken || '',
      request.ip()
    )
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

    UserRegistered.dispatch(user.email, token, user.fullName ?? undefined)

    return response.created({
      message: 'Registration successful. Please check your email to verify your account.',
      user: await ctx.serialize.withoutWrapping(UserTransformer.transform(user)),
    })
  }
}
