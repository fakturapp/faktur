import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import User from '#models/account/user'
import TokenService from '#services/auth/token_service'
import VerifyEmailNotification from '#mails/verify_email_notification'

export default class Resend {
  async handle({ request, response }: HttpContext) {
    const { email } = request.only(['email'])

    if (!email) {
      return response.badRequest({ message: 'Email is required' })
    }

    const user = await User.findBy('email', email)

    if (!user || user.emailVerified) {
      return response.ok({
        message: 'If the email exists and is unverified, a new verification link has been sent.',
      })
    }

    const { token, hash: tokenHash } = TokenService.generateEmailVerificationToken()

    user.emailVerificationToken = tokenHash
    user.emailVerificationSentAt = DateTime.now()
    await user.save()

    mail.sendLater(new VerifyEmailNotification(user.email, token, user.fullName ?? undefined))

    return response.ok({
      message: 'If the email exists and is unverified, a new verification link has been sent.',
    })
  }
}
