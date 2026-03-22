import type { HttpContext } from '@adonisjs/core/http'
import mail from '@adonisjs/mail/services/main'
import User from '#models/account/user'
import TokenService from '#services/auth/token_service'
import PasswordResetNotification from '#mails/password_reset_notification'
import { passwordResetRequestValidator } from '#validators/auth/auth_validators'

export default class Request {
  async handle({ request, response }: HttpContext) {
    const data = await request.validateUsing(passwordResetRequestValidator)

    const user = await User.findBy('email', data.email)

    if (!user) {
      return response.ok({
        message: 'If an account exists with this email, a reset link has been sent.',
      })
    }

    const { token, hash: tokenHash, expiresAt } = TokenService.generatePasswordResetToken()

    user.passwordResetToken = tokenHash
    user.passwordResetExpiresAt = expiresAt
    await user.save()

    mail.sendLater(new PasswordResetNotification(user.email, token, user.fullName ?? undefined))

    return response.ok({
      message: 'If an account exists with this email, a reset link has been sent.',
    })
  }
}
