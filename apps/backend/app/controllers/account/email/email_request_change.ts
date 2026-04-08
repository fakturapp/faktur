import type { HttpContext } from '@adonisjs/core/http'
import crypto from 'node:crypto'
import { DateTime } from 'luxon'
import User from '#models/account/user'
import EmailChangeRequested from '#events/email_change_requested'
import { emailChangeValidator } from '#validators/account_validator'
import EmailBlacklistService from '#services/security/email_blacklist_service'

export default class EmailRequestChange {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const { newEmail } = await request.validateUsing(emailChangeValidator)

    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      return response.badRequest({ message: "Le nouvel email est identique à l'actuel" })
    }

    const isDisposable = await EmailBlacklistService.isDisposableEmail(newEmail)
    if (isDisposable) {
      return response.unprocessableEntity({
        message: 'Les adresses email temporaires ne sont pas autorisées. Veuillez utiliser une adresse email permanente ou contacter support@fakturapp.cc pour faire whitelister votre domaine.',
        code: 'DISPOSABLE_EMAIL',
      })
    }

    const existing = await User.findBy('email', newEmail)
    if (existing) {
      return response.conflict({ message: 'Cet email est déjà utilisé par un autre compte' })
    }

    if (
      user.securityCodeExpiresAt &&
      user.securityCodeExpiresAt > DateTime.now().minus({ minutes: 4 })
    ) {
      return response.tooManyRequests({ message: 'Veuillez attendre avant de renvoyer un code' })
    }

    const code = String(crypto.randomInt(100000, 999999))

    user.pendingEmail = newEmail.toLowerCase()
    user.securityCode = code
    user.securityCodeExpiresAt = DateTime.now().plus({ minutes: 5 })
    await user.save()

    await EmailChangeRequested.dispatch(newEmail, code, user.fullName || undefined)

    return response.ok({ message: 'Code de vérification envoyé à la nouvelle adresse' })
  }
}
