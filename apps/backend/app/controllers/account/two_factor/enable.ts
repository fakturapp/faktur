import type { HttpContext } from '@adonisjs/core/http'
import mail from '@adonisjs/mail/services/main'
import { twoFactorSetupValidator } from '#validators/auth/auth_validators'
import TwoFactorService from '#services/auth/two_factor_service'
import TwoFactorEnabledNotification from '#mails/two_factor_enabled_notification'
import AuditLog from '#models/shared/audit_log'

export default class Enable {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const data = await request.validateUsing(twoFactorSetupValidator)

    if (user.twoFactorEnabled) {
      return response.badRequest({ message: 'Two-factor authentication is already enabled' })
    }

    if (!user.twoFactorSecretEncrypted) {
      return response.badRequest({
        message: 'Please setup 2FA first by calling /account/2fa/setup',
      })
    }

    const secret = TwoFactorService.decryptSecret(user.twoFactorSecretEncrypted)
    const isValid = TwoFactorService.verifyToken(secret, data.code)

    if (!isValid.valid) {
      return response.badRequest({ message: 'Invalid verification code' })
    }

    const recoveryCodes = TwoFactorService.generateRecoveryCodes()
    user.recoveryCodesEncrypted = TwoFactorService.encryptRecoveryCodes(recoveryCodes)
    user.twoFactorEnabled = true
    await user.save()

    await AuditLog.create({
      userId: user.id,
      action: 'user.2fa_enabled',
      resourceType: 'user',
      resourceId: user.id,
      severity: 'warning',
    })

    mail.sendLater(new TwoFactorEnabledNotification(user.email, user.fullName ?? undefined))

    return response.ok({
      message: 'Two-factor authentication enabled successfully',
      recoveryCodes,
      warning: 'Save these recovery codes securely. They will not be shown again.',
    })
  }
}
