import type { HttpContext } from '@adonisjs/core/http'
import { emailAppealValidator } from '#validators/email_blocklist_validator'
import EmailBlocklistService from '#services/security/email_blocklist_service'
import EmailAppeal from '#models/security/email_appeal'

export default class EmailAppealController {
  async handle({ request, response }: HttpContext) {
    const data = await request.validateUsing(emailAppealValidator)

    const blocked = await EmailBlocklistService.isBlocked(data.email)
    if (!blocked) {
      return response.badRequest({
        message: "Cette adresse email n'est pas bloquée.",
      })
    }

    const domain = EmailBlocklistService.extractDomain(data.email)

    // Check for existing pending appeal for this email
    const existing = await EmailAppeal.query()
      .where('email', data.email)
      .where('status', 'pending')
      .first()

    if (existing) {
      return response.conflict({
        message: 'Une demande de déblocage est déjà en cours pour cette adresse email.',
      })
    }

    await EmailAppeal.create({
      email: data.email,
      domain,
      reason: data.reason,
      status: 'pending',
      ipAddress: request.ip(),
    })

    return response.created({
      message:
        'Votre demande de déblocage a été envoyée. Nous l\'examinerons sous 48h.',
    })
  }
}
