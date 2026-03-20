import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import EmailTemplate from '#models/email/email_template'

const updateTemplateValidator = vine.compile(
  vine.object({
    templateType: vine.enum(['invoice_send', 'quote_send', 'credit_note_send']),
    subject: vine.string().trim().maxLength(500),
    body: vine.string().trim().maxLength(5000),
  })
)

export default class Update {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const { templateType, subject, body } = await request.validateUsing(updateTemplateValidator)

    let template = await EmailTemplate.query()
      .where('team_id', teamId)
      .where('template_type', templateType)
      .first()

    if (template) {
      template.subject = subject
      template.body = body
      await template.save()
    } else {
      template = await EmailTemplate.create({
        teamId,
        templateType,
        subject,
        body,
      })
    }

    return response.ok({ template: { subject: template.subject, body: template.body } })
  }
}
