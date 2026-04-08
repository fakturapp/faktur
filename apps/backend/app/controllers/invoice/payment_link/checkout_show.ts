import type { HttpContext } from '@adonisjs/core/http'
import PaymentLink from '#models/invoice/payment_link'
import encryptionService from '#services/encryption/encryption_service'

export default class CheckoutShow {
  async handle({ params, response }: HttpContext) {
    const tokenHash = encryptionService.hash(params.token)

    const paymentLink = await PaymentLink.query()
      .where('token_hash', tokenHash)
      .first()

    response.header('X-Robots-Tag', 'noindex, nofollow')
    response.header('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.header('X-Frame-Options', 'DENY')

    if (!paymentLink) {
      return response.notFound({ message: 'Payment link not found' })
    }

    let maskedEmail: string | null = null
    if (paymentLink.clientEmail) {
      try {
        const email = encryptionService.decrypt(paymentLink.clientEmail)
        const [local, domain] = email.split('@')
        if (local && domain) {
          const maskedLocal = local[0] + '****'
          const domParts = domain.split('.')
          const maskedDomain = domParts[0][0] + '**' + (domParts.length > 1 ? '.' + domParts.slice(1).join('.') : '')
          maskedEmail = `${maskedLocal}@${maskedDomain}`
        }
      } catch {
        // ignore
      }
    }

    // Decrypt company name
    let companyName: string | null = null
    if (paymentLink.companyName) {
      try {
        companyName = encryptionService.decrypt(paymentLink.companyName)
      } catch {
        // ignore
      }
    }

    // Check if already confirmed
    if (paymentLink.confirmedAt) {
      return response.ok({
        status: 'confirmed',
        invoiceNumber: paymentLink.invoiceNumber,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        companyName,
        maskedEmail,
      })
    }

    // Check if already paid (pending confirmation)
    if (paymentLink.paidAt) {
      return response.ok({
        status: 'paid_pending',
        invoiceNumber: paymentLink.invoiceNumber,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        companyName,
        maskedEmail,
      })
    }

    // Check expiration
    if (paymentLink.isExpired) {
      return response.gone({ message: 'Payment link has expired' })
    }

    // Check if active
    if (!paymentLink.isActive) {
      return response.gone({ message: 'Payment link is no longer active' })
    }

    response.header('Content-Type', 'application/json; charset=utf-8')
    return response.ok({
      status: 'active',
      invoiceNumber: paymentLink.invoiceNumber,
      amount: paymentLink.amount,
      currency: paymentLink.currency,
      paymentMethod: paymentLink.paymentMethod,
      isPasswordProtected: !!paymentLink.passwordHash,
      showIban: paymentLink.showIban,
      companyName,
      maskedEmail,
      hasPdf: !!(paymentLink.pdfStorageKey || paymentLink.pdfData),
      hasStripe: paymentLink.paymentMethod === 'stripe' && !!paymentLink.encryptedStripeSecretKey,
    })
  }
}
