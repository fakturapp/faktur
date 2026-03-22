import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import crypto from 'node:crypto'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import User from '#models/account/user'
import SecurityCodeNotification from '#mails/security_code_notification'

const validator = vine.compile(
  vine.object({
    newEmail: vine.string().email().trim().maxLength(254),
  })
)

export default class EmailRequestChange {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const { newEmail } = await request.validateUsing(validator)

    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      return response.badRequest({ message: 'Le nouvel email est identique à l\'actuel' })
    }

    const existing = await User.findBy('email', newEmail)
    if (existing) {
      return response.conflict({ message: 'Cet email est déjà utilisé par un autre compte' })
    }

    // Rate limit: reuse securityCodeExpiresAt check
    if (user.securityCodeExpiresAt && user.securityCodeExpiresAt > DateTime.now().minus({ minutes: 4 })) {
      return response.tooManyRequests({ message: 'Veuillez attendre avant de renvoyer un code' })
    }

    const code = String(crypto.randomInt(100000, 999999))

    user.pendingEmail = newEmail.toLowerCase()
    user.securityCode = code
    user.securityCodeExpiresAt = DateTime.now().plus({ minutes: 5 })
    await user.save()

    // Send code to the NEW email
    await mail.send(new SecurityCodeNotification(newEmail, code, user.fullName || undefined))

    return response.ok({ message: 'Code de vérification envoyé à la nouvelle adresse' })
  }
}
