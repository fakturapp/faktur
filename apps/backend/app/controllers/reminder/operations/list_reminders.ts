import type { HttpContext } from '@adonisjs/core/http'
import PaymentReminder from '#models/reminder/payment_reminder'
import PaymentReminderTransformer from '#transformers/payment_reminder_transformer'

export default class ListReminders {
  async handle(ctx: HttpContext) {
    const { auth, params, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const reminders = await PaymentReminder.query()
      .where('team_id', teamId)
      .where('invoice_id', params.id)
      .orderBy('sent_at', 'desc')

    return response.ok({
      reminders: await ctx.serialize.withoutWrapping(
        PaymentReminderTransformer.transform(reminders)
      ),
    })
  }
}
