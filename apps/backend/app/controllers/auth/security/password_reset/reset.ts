import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import User from '#models/account/user'
import TokenService from '#services/auth/token_service'
import AuditLog from '#models/shared/audit_log'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'

export default class Reset {
  async handle({ request, response }: HttpContext) {
    const data = request.only(['token', 'password', 'password_confirmation'])

    if (!data.token || !data.password) {
      return response.badRequest({ message: 'Token and password are required' })
    }

    if (data.password !== data.password_confirmation) {
      return response.badRequest({ message: 'Passwords do not match' })
    }

    const tokenHash = TokenService.hashToken(data.token)

    const user = await User.findBy('passwordResetToken', tokenHash)

    if (!user) {
      return response.badRequest({ message: 'Invalid or expired reset token' })
    }

    if (user.passwordResetExpiresAt && DateTime.now() > user.passwordResetExpiresAt) {
      return response.badRequest({ message: 'Reset token has expired' })
    }

    // Save old salt so we can re-derive old KEK if user provides old password later
    const hadEncryptedData = !!user.saltKdf
    if (hadEncryptedData) {
      user.oldSaltKdf = user.saltKdf
    }

    // Generate new crypto keys for the new password
    const newSalt = zeroAccessCryptoService.generateSalt()
    const newSaltHex = newSalt.toString('hex')

    user.password = data.password
    user.passwordResetToken = null
    user.passwordResetExpiresAt = null
    user.failedLoginAttempts = 0
    user.lockedUntil = null
    user.saltKdf = newSaltHex

    // Mark that crypto migration is needed if user had encrypted data
    if (hadEncryptedData) {
      user.cryptoResetNeeded = true
    }

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
