import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import User from '#models/account/user'
import AuditLog from '#models/shared/audit_log'
import LoginHistory from '#models/account/login_history'
import TwoFactorService from '#services/auth/two_factor_service'
import { twoFactorVerifyValidator } from '#validators/auth/auth_validators'
import UserTransformer from '#transformers/user_transformer'
import { setAuthSessionCookies } from '#services/auth/auth_cookie_service'

export default class Verify {
  async handle(ctx: HttpContext) {
    const { request, response } = ctx
    const data = await request.validateUsing(twoFactorVerifyValidator)

    const user = await User.find(data.userId)

    if (!user || !user.twoFactorEnabled) {
      return response.unauthorized({ message: 'Invalid request' })
    }

    if (data.code.includes('-') && user.recoveryCodesEncrypted) {
      const result = TwoFactorService.verifyRecoveryCode(data.code, user.recoveryCodesEncrypted)
      if (!result.valid) {
        return response.unauthorized({ message: 'Invalid verification code' })
      }
      user.recoveryCodesEncrypted = TwoFactorService.encryptRecoveryCodes(result.remainingCodes)
      await user.save()

      await AuditLog.create({
        userId: user.id,
        action: 'user.recovery_code_used',
        resourceType: 'user',
        resourceId: user.id,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
        severity: 'warning',
        metadata: { remainingCodes: result.remainingCodes.length },
      })
    } else {
      if (!user.twoFactorSecretEncrypted) {
        return response.badRequest({ message: '2FA configuration error' })
      }
      const secret = TwoFactorService.decryptSecret(user.twoFactorSecretEncrypted)
      const isValid = TwoFactorService.verifyToken(secret, data.code)

      if (!isValid.valid) {
        return response.unauthorized({ message: 'Invalid verification code' })
      }
    }

    user.failedLoginAttempts = 0
    user.lockedUntil = null
    user.lastLoginAt = DateTime.now()
    await user.save()

    const token = await User.accessTokens.create(user, ['*'], {
      expiresIn: '15 days',
    })

    await LoginHistory.create({
      userId: user.id,
      tokenIdentifier: String(token.identifier),
      ipAddress: request.ip(),
      userAgent: request.header('user-agent') ?? undefined,
      status: 'success',
      isSuspicious: false,
    })

    await AuditLog.create({
      userId: user.id,
      action: 'user.login',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      severity: 'info',
    })

    const releasedToken = token.value!.release()
    setAuthSessionCookies(response, { authToken: releasedToken })

    return response.ok({
      message: 'Login successful',
      user: await ctx.serialize.withoutWrapping(UserTransformer.transform(user)),
      token: releasedToken,
    })
  }
}
