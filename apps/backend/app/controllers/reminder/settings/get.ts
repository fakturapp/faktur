import type { HttpContext } from '@adonisjs/core/http'
import PaymentReminderSetting from '#models/reminder/payment_reminder_setting'

export default class Get {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    let settings = await PaymentReminderSetting.query().where('team_id', teamId).first()

    if (!settings) {
      return response.ok({
        reminderSettings: {
          enabled: false,
          daysBeforeDue: null,
          daysAfterDue: 7,
          repeatIntervalDays: null,
          emailSubjectTemplate: 'Rappel : Facture {numero} en attente de paiement',
          emailBodyTemplate:
            "Bonjour,\n\nNous vous rappelons que la facture {numero} d'un montant de {montant} est arrivee a echeance le {date_echeance}.\n\nMerci de bien vouloir proceder au reglement.\n\nCordialement",
          autoSend: false,
          emailAccountId: null,
        },
      })
    }

    return response.ok({
      reminderSettings: {
        enabled: settings.enabled,
        daysBeforeDue: settings.daysBeforeDue,
        daysAfterDue: settings.daysAfterDue,
        repeatIntervalDays: settings.repeatIntervalDays,
        emailSubjectTemplate: settings.emailSubjectTemplate,
        emailBodyTemplate: settings.emailBodyTemplate,
        autoSend: settings.autoSend,
        emailAccountId: settings.emailAccountId,
      },
    })
  }
}
