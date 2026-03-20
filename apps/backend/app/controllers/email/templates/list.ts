import type { HttpContext } from '@adonisjs/core/http'
import EmailTemplate from '#models/email/email_template'

const DEFAULTS: Record<string, { subject: string; body: string }> = {
  invoice_send: {
    subject: '{type} {numero}',
    body: 'Bonjour{client_name},\n\nVeuillez trouver ci-joint la {type_lower} {numero} d\'un montant de {montant}.\n\nCordialement',
  },
  quote_send: {
    subject: '{type} {numero}',
    body: 'Bonjour{client_name},\n\nVeuillez trouver ci-joint le {type_lower} {numero} d\'un montant de {montant}.\n\nCordialement',
  },
  credit_note_send: {
    subject: '{type} {numero}',
    body: 'Bonjour{client_name},\n\nVeuillez trouver ci-joint l\'avoir {numero} d\'un montant de {montant}.\n\nCordialement',
  },
}

export default class List {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const templates = await EmailTemplate.query().where('team_id', teamId)

    const result: Record<string, { subject: string; body: string }> = {}
    for (const type of Object.keys(DEFAULTS)) {
      const existing = templates.find((t) => t.templateType === type)
      result[type] = existing
        ? { subject: existing.subject, body: existing.body }
        : DEFAULTS[type]
    }

    return response.ok({ templates: result })
  }
}
