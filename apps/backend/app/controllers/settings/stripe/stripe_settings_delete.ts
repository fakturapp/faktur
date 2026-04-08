import type { HttpContext } from '@adonisjs/core/http'
import InvoiceSetting from '#models/team/invoice_setting'

export default class StripeSettingsDelete {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) return response.badRequest({ message: 'No team selected' })

    const settings = await InvoiceSetting.query().where('team_id', teamId).firstOrFail()

    settings.stripePublishableKey = null
    settings.stripeSecretKey = null
    settings.stripeWebhookSecret = null
    settings.stripeWebhookSecretApp = null

    settings.paymentMethods = settings.paymentMethods.filter((m) => m !== 'stripe')

    await settings.save()

    return response.ok({ message: 'Configuration Stripe supprimée' })
  }
}
