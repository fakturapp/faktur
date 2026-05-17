import type { HttpContext } from '@adonisjs/core/http'
import EmailTemplate from '#models/email/email_template'

const ALLOWED = ['invoice_send', 'quote_send', 'credit_note_send'] as const

export default class Reset {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const type = String(params.type)
    if (!ALLOWED.includes(type as (typeof ALLOWED)[number])) {
      return response.badRequest({ message: 'Invalid template type' })
    }

    await EmailTemplate.query().where('team_id', teamId).where('template_type', type).delete()

    return response.ok({ message: 'Template réinitialisé' })
  }
}
