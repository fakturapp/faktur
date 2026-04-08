import type { HttpContext } from '@adonisjs/core/http'
import InvoiceSetting from '#models/team/invoice_setting'
import { decryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'
import env from '#start/env'

function maskKey(key: string): string {
  if (key.length <= 12) return '****'
  return key.substring(0, 7) + '****' + key.substring(key.length - 4)
}

export default class StripeSettingsShow {
  async handle(ctx: HttpContext) {
    const { auth, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) return response.badRequest({ message: 'No team selected' })

    const settings = await InvoiceSetting.query().where('team_id', teamId).first()
    if (!settings) return response.ok({ isConfigured: false })

    const hasKeys = !!settings.stripePublishableKey && !!settings.stripeSecretKey

    if (!hasKeys) return response.ok({ isConfigured: false })

    decryptModelFields(settings, [...ENCRYPTED_FIELDS.invoiceSetting], dek)

    const appUrl = env.get('APP_URL') || 'http://localhost:3333'
    const webhookUrl = `${appUrl}/webhooks/stripe`

    return response.ok({
      isConfigured: true,
      publishableKeyMasked: settings.stripePublishableKey ? maskKey(settings.stripePublishableKey) : null,
      secretKeyMasked: settings.stripeSecretKey ? maskKey(settings.stripeSecretKey) : null,
      hasWebhookSecret: !!settings.stripeWebhookSecret,
      webhookUrl,
      isTestMode: settings.stripePublishableKey?.startsWith('pk_test_') || false,
    })
  }
}
