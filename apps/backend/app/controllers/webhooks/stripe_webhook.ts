import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import PaymentLink from '#models/invoice/payment_link'
import Invoice from '#models/invoice/invoice'
import InvoiceSetting from '#models/team/invoice_setting'
import User from '#models/account/user'
import encryptionService from '#services/encryption/encryption_service'
import stripeService from '#services/stripe/stripe_service'
import r2StorageService from '#services/storage/r2_storage_service'
import { broadcastDocumentSaved } from '#services/collaboration/websocket_service'
import { StripePaymentToCreator } from '#mails/stripe_payment_to_creator'
import { StripePaymentToClient } from '#mails/stripe_payment_to_client'
import mail from '@adonisjs/mail/services/main'

export default class StripeWebhook {
  async handle({ request, response }: HttpContext) {
    const rawBody: unknown = request.raw() || ''
    const signature = request.header('stripe-signature')

    if (!signature) {
      return response.badRequest({ message: 'Missing stripe-signature header' })
    }

    // Parse the event JSON to get metadata for team lookup
    let eventJson: any
    try {
      let bodyAsString: string
      if (typeof rawBody === 'string') {
        bodyAsString = rawBody
      } else if (rawBody && typeof (rawBody as any).toString === 'function') {
        bodyAsString = (rawBody as { toString: () => string }).toString()
      } else {
        bodyAsString = String(rawBody)
      }
      eventJson = JSON.parse(bodyAsString)
    } catch {
      return response.badRequest({ message: 'Invalid JSON body' })
    }

    // Extract team_id from the payment intent metadata
    const paymentIntent = eventJson?.data?.object
    const teamId = paymentIntent?.metadata?.team_id

    if (!teamId) {
      return response.badRequest({ message: 'Missing team_id in metadata' })
    }

    // Load invoice settings to get webhook secret
    const settings = await InvoiceSetting.query().where('team_id', teamId).first()
    if (!settings?.stripeWebhookSecretApp) {
      return response.badRequest({ message: 'Webhook secret not configured' })
    }

    // Decrypt app-level encrypted webhook secret
    let webhookSecret: string
    try {
      webhookSecret = encryptionService.decrypt(settings.stripeWebhookSecretApp)
    } catch {
      return response.internalServerError({ message: 'Failed to decrypt webhook secret' })
    }

    // Verify signature
    let event: any
    try {
      event = stripeService.constructWebhookEvent(rawBody as string | Buffer, signature, webhookSecret)
    } catch {
      return response.badRequest({ message: 'Invalid signature' })
    }

    // Handle events
    if (event.type === 'payment_intent.succeeded') {
      await this.handlePaymentSucceeded(event.data.object)
    } else if (event.type === 'payment_intent.payment_failed') {
      await this.handlePaymentFailed(event.data.object)
    }

    return response.ok({ received: true })
  }

  private async handlePaymentSucceeded(pi: any) {
    const paymentLinkId = pi.metadata?.payment_link_id
    if (!paymentLinkId) return

    const paymentLink = await PaymentLink.find(paymentLinkId)
    if (!paymentLink) return

    // Idempotency: skip if already processed
    if (paymentLink.stripeStatus === 'succeeded') return

    // Update payment link
    paymentLink.paidAt = DateTime.now()
    paymentLink.confirmedAt = DateTime.now()
    paymentLink.stripeStatus = 'succeeded'
    paymentLink.isActive = false

    // Wipe sensitive data
    paymentLink.encryptedStripePublishableKey = null
    paymentLink.encryptedStripeSecretKey = null
    paymentLink.encryptedIban = null
    paymentLink.encryptedBic = null
    paymentLink.encryptedBankName = null

    // Delete PDF from R2
    if (paymentLink.pdfStorageKey) {
      try { await r2StorageService.delete(paymentLink.pdfStorageKey) } catch { /* */ }
      paymentLink.pdfStorageKey = null
    }
    paymentLink.pdfData = null

    await paymentLink.save()

    // Schedule auto-deletion of payment link in 5 minutes
    const linkId = paymentLink.id
    setTimeout(async () => {
      try {
        const link = await PaymentLink.find(linkId)
        if (link) await link.delete()
      } catch { /* */ }
    }, 5 * 60 * 1000)

    // Set invoice to paid (auto-confirmed by Stripe)
    const invoice = await Invoice.find(paymentLink.invoiceId)
    if (invoice) {
      invoice.status = 'paid'
      invoice.paidDate = DateTime.now().toFormat('yyyy-MM-dd')
      await invoice.save()
      broadcastDocumentSaved('invoice', invoice.id, 'system')
    }

    // Send email to John (creator)
    try {
      const creator = await User.find(paymentLink.createdByUserId)
      if (creator?.email) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
        const invoiceUrl = `${frontendUrl}/dashboard/invoices?open=${paymentLink.invoiceId}`
        await mail.send(
          new StripePaymentToCreator(
            creator.email,
            paymentLink.invoiceNumber,
            paymentLink.amount,
            paymentLink.currency,
            invoiceUrl
          )
        )
      }
    } catch { /* */ }

    // Send email to Abel (client)
    if (paymentLink.clientEmail) {
      try {
        const clientEmail = encryptionService.decrypt(paymentLink.clientEmail)
        let clientName: string | undefined
        if (paymentLink.clientName) {
          try { clientName = encryptionService.decrypt(paymentLink.clientName) } catch { /* */ }
        }
        await mail.send(
          new StripePaymentToClient(clientEmail, paymentLink.invoiceNumber, clientName)
        )
      } catch { /* */ }
    }
  }

  private async handlePaymentFailed(pi: any) {
    const paymentLinkId = pi.metadata?.payment_link_id
    if (!paymentLinkId) return

    const paymentLink = await PaymentLink.find(paymentLinkId)
    if (!paymentLink) return

    paymentLink.stripeStatus = 'failed'
    await paymentLink.save()
  }
}
