import type { HttpContext } from '@adonisjs/core/http'
import PaymentLink from '#models/invoice/payment_link'
import encryptionService from '#services/encryption/encryption_service'

export default class CheckoutDownloadPdf {
  async handle({ params, response }: HttpContext) {
    response.header('X-Robots-Tag', 'noindex, nofollow')
    response.header('Cache-Control', 'no-store, no-cache, must-revalidate')

    const tokenHash = encryptionService.hash(params.token)

    const paymentLink = await PaymentLink.query()
      .where('token_hash', tokenHash)
      .first()

    if (!paymentLink) {
      return response.notFound({ message: 'Payment link not found' })
    }

    // Check if link is active or was paid (allow download even after payment)
    if (!paymentLink.isActive && !paymentLink.paidAt) {
      return response.gone({ message: 'Payment link is no longer active' })
    }

    if (paymentLink.isExpired && !paymentLink.paidAt) {
      return response.gone({ message: 'Payment link has expired' })
    }

    // Try to serve stored PDF
    if (paymentLink.pdfData) {
      const filename = `${paymentLink.invoiceNumber}.pdf`
      response.header('Content-Type', 'application/pdf')
      response.header('Content-Disposition', `attachment; filename="${filename}"`)
      return response.send(paymentLink.pdfData)
    }

    // If no stored PDF, we can't generate one without DEK
    return response.notFound({ message: 'PDF not available' })
  }
}
