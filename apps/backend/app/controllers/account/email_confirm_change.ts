import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import AuditLog from '#models/shared/audit_log'

const validator = vine.compile(
  vine.object({
    code: vine.string().trim().fixedLength(6),
  })
)

export default class EmailConfirmChange {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const { code } = await request.validateUsing(validator)

    if (!user.pendingEmail || !user.securityCode || !user.securityCodeExpiresAt) {
      return response.badRequest({ message: 'Aucun changement d\'email en cours' })
    }

    if (user.securityCodeExpiresAt < DateTime.now()) {
      user.pendingEmail = null
      user.securityCode = null
      user.securityCodeExpiresAt = null
      await user.save()
      return response.badRequest({ message: 'Le code a expiré. Veuillez en demander un nouveau.' })
    }

    if (user.securityCode !== code) {
      return response.badRequest({ message: 'Code invalide' })
    }

    const oldEmail = user.email

    user.email = user.pendingEmail
    user.pendingEmail = null
    user.securityCode = null
    user.securityCodeExpiresAt = null
    await user.save()

    await AuditLog.create({
      userId: user.id,
      action: 'user.email_changed',
      ipAddress: request.ip(),
      metadata: JSON.stringify({ oldEmail, newEmail: user.email }),
    })

    return response.ok({ message: 'Email mis à jour avec succès', email: user.email })
  }
}
