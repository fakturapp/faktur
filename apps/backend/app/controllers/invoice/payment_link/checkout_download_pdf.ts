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

    const filename = `${paymentLink.invoiceNumber}.pdf`

    // Proxy from R2 URL (avoids CORS issues with CDN direct redirect)
    if (paymentLink.pdfStorageKey) {
      try {
        const r2Response = await fetch(paymentLink.pdfStorageKey)
        if (r2Response.ok) {
          const buffer = Buffer.from(await r2Response.arrayBuffer())
          response.header('Content-Type', 'application/pdf')
          response.header('Content-Disposition', `attachment; filename="${filename}"`)
          return response.send(buffer)
        }
      } catch {
        // Fall through to other options
      }
    }

    // Fallback: serve from DB blob
    if (paymentLink.pdfData) {
      response.header('Content-Type', 'application/pdf')
      response.header('Content-Disposition', `attachment; filename="${filename}"`)
      return response.send(paymentLink.pdfData)
    }

    return response.notFound({ message: 'PDF not available' })
  }
}
