import type { HttpContext } from '@adonisjs/core/http'
import InvoiceSetting from '#models/team/invoice_setting'
import { saveStripeSettingsValidator } from '#validators/stripe_settings_validator'
import { encryptModelFields } from '#services/crypto/field_encryption_helper'
import encryptionService from '#services/encryption/encryption_service'
import stripeService from '#services/stripe/stripe_service'

export default class StripeSettingsSave {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) return response.badRequest({ message: 'No team selected' })

    const payload = await request.validateUsing(saveStripeSettingsValidator)

    // Validate keys with Stripe API
    const validation = await stripeService.validateKeys(payload.publishableKey, payload.secretKey)
    if (!validation.valid) {
      return response.badRequest({ message: validation.error })
    }

    const settings = await InvoiceSetting.query().where('team_id', teamId).firstOrFail()

    // Prepare data for DEK encryption
    const data: Record<string, any> = {
      stripePublishableKey: payload.publishableKey,
      stripeSecretKey: payload.secretKey,
      stripeWebhookSecret: payload.webhookSecret,
    }

    // Encrypt with DEK for settings storage
    encryptModelFields(data, ['stripePublishableKey', 'stripeSecretKey', 'stripeWebhookSecret'] as any, dek)

    settings.stripePublishableKey = data.stripePublishableKey
    settings.stripeSecretKey = data.stripeSecretKey
    settings.stripeWebhookSecret = data.stripeWebhookSecret

    // Also store webhook secret with app-level encryption for webhook handler (no DEK available)
    settings.stripeWebhookSecretApp = encryptionService.encrypt(payload.webhookSecret)

    // Add 'stripe' to payment methods if not present
    if (!settings.paymentMethods.includes('stripe')) {
      settings.paymentMethods = [...settings.paymentMethods, 'stripe']
    }

    await settings.save()

    return response.ok({
      message: 'Stripe configuré avec succès',
      isTestMode: payload.publishableKey.startsWith('pk_test_'),
    })
  }
}
