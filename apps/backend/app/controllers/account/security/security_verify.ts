import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'
import SecurityCodeRequested from '#events/security_code_requested'
import TwoFactorService from '#services/auth/two_factor_service'
import { securityVerifyValidator } from '#validators/account_validator'
import { timingSafeEqualStr } from '#services/security/timing_safe'

export default class SecurityVerify {
  async sendCode({ auth, response }: HttpContext) {
    const user = auth.user!

    if (
      user.securityCodeExpiresAt &&
      user.securityCodeExpiresAt.minus({ minutes: 4 }) > DateTime.now()
    ) {
      return response.tooManyRequests({ message: 'Please wait before requesting a new code' })
    }

    const code = String(crypto.randomInt(100000, 999999))

    user.securityCode = code
    user.securityCodeExpiresAt = DateTime.now().plus({ minutes: 5 })
    await user.save()

    SecurityCodeRequested.dispatch(user.email, code, user.fullName ?? undefined)

    return response.ok({
      message: 'Security code sent',
      expiresAt: user.securityCodeExpiresAt.toISO(),
    })
  }

  async verify({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(securityVerifyValidator)
    const method = payload.method || 'email'

    if (method === 'totp') {
      if (!user.twoFactorEnabled || !user.twoFactorSecretEncrypted) {
        return response.badRequest({ message: '2FA is not enabled' })
      }

      const secret = TwoFactorService.decryptSecret(user.twoFactorSecretEncrypted)
      const result = TwoFactorService.verifyToken(secret, payload.code)

      if (!result.valid) {
        return response.unauthorized({ message: 'Invalid TOTP code' })
      }

      return response.ok({ verified: true })
    }

    if (method === 'recovery') {
      if (!user.recoveryCodesEncrypted) {
        return response.badRequest({ message: 'No recovery codes available' })
      }

      const result = TwoFactorService.verifyRecoveryCode(payload.code, user.recoveryCodesEncrypted)

      if (!result.valid) {
        return response.unauthorized({ message: 'Invalid recovery code' })
      }

      user.recoveryCodesEncrypted = TwoFactorService.encryptRecoveryCodes(result.remainingCodes)
      await user.save()

      return response.ok({ verified: true })
    }

    if (!user.securityCode || !user.securityCodeExpiresAt) {
      return response.badRequest({ message: 'No security code was sent' })
    }

    if (user.securityCodeExpiresAt < DateTime.now()) {
      user.securityCode = null
      user.securityCodeExpiresAt = null
      await user.save()
      return response.unauthorized({ message: 'Security code expired' })
    }

    if (!timingSafeEqualStr(user.securityCode, payload.code)) {
      return response.unauthorized({ message: 'Invalid security code' })
    }

    user.securityCode = null
    user.securityCodeExpiresAt = null
    await user.save()

    return response.ok({ verified: true })
  }
}
