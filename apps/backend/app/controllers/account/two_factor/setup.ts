import type { HttpContext } from '@adonisjs/core/http'
import TwoFactorService from '#services/auth/two_factor_service'

export default class Setup {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!

    if (user.twoFactorEnabled) {
      return response.badRequest({ message: 'Two-factor authentication is already enabled' })
    }

    const secret = TwoFactorService.generateSecret(user.email)
    const qrCode = await TwoFactorService.generateQRCode(secret.otpauth_url)

    user.twoFactorSecretEncrypted = TwoFactorService.encryptSecret(secret.base32)
    await user.save()

    return response.ok({
      secret: secret.base32,
      qrCode,
      message: 'Scan the QR code with your authenticator app, then verify with a code',
    })
  }
}
