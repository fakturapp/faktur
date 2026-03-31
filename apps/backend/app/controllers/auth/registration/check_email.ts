import type { HttpContext } from '@adonisjs/core/http'
import { checkEmailValidator } from '#validators/email_blocklist_validator'
import EmailBlocklistService from '#services/security/email_blocklist_service'

export default class CheckEmail {
  async handle({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(checkEmailValidator)

    const blocked = await EmailBlocklistService.isBlocked(email)

    if (blocked) {
      const domain = EmailBlocklistService.extractDomain(email)
      return response.ok({
        allowed: false,
        reason: 'disposable_email',
        domain,
        message:
          'Les adresses email temporaires ne sont pas autorisées. Veuillez utiliser une adresse email permanente.',
      })
    }

    return response.ok({
      allowed: true,
    })
  }
}
