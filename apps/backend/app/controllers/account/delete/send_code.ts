import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'
import mail from '@adonisjs/mail/services/main'
import SecurityCodeNotification from '#mails/security_code_notification'
import { validateDeletionSession } from './_helpers.js'

export default class SendCode {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const token = request.header('x-deletion-token')

    const error = validateDeletionSession(user, token, 3)
    if (error) return response.badRequest({ message: error })

    if (
      user.deletionCodeExpiresAt &&
      DateTime.now().diff(user.deletionCodeExpiresAt.minus({ minutes: 5 }), 'seconds').seconds < 60
    ) {
      return response.tooManyRequests({ message: 'Veuillez patienter avant de renvoyer un code' })
    }

    const code = String(crypto.randomInt(100000, 999999))

    user.deletionCode = code
    user.deletionCodeExpiresAt = DateTime.now().plus({ minutes: 5 })
    await user.save()

    await mail.sendLater(
      new SecurityCodeNotification(user.email, code, user.fullName || undefined)
    )

    return response.ok({
      message: 'Code envoyé',
      expiresAt: user.deletionCodeExpiresAt.toISO(),
    })
  }
}
