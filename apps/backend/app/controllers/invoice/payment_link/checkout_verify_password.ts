import type { HttpContext } from '@adonisjs/core/http'
import crypto from 'node:crypto'
import PaymentLink from '#models/invoice/payment_link'
import encryptionService from '#services/encryption/encryption_service'

export default class CheckoutVerifyPassword {
  async handle({ params, request, response }: HttpContext) {
    response.header('X-Robots-Tag', 'noindex, nofollow')
    response.header('Cache-Control', 'no-store, no-cache, must-revalidate')

    const tokenHash = encryptionService.hash(params.token)

    const paymentLink = await PaymentLink.query()
      .where('token_hash', tokenHash)
      .where('is_active', true)
      .first()

    if (!paymentLink || paymentLink.isExpired || paymentLink.paidAt) {
      return response.notFound({ message: 'Payment link not found or no longer valid' })
    }

    if (!paymentLink.passwordHash) {
      return response.badRequest({ message: 'This payment link is not password-protected' })
    }

    const { password } = request.only(['password'])

    if (!password || typeof password !== 'string') {
      return response.badRequest({ message: 'Password is required' })
    }

    // Decrypt the stored password hash (app-level encryption)
    let storedHash: string
    try {
      storedHash = encryptionService.decrypt(paymentLink.passwordHash)
    } catch {
      return response.internalServerError({ message: 'Internal error' })
    }

    // Hash the provided password and compare
    const providedHash = encryptionService.hash(password)

    if (!encryptionService.timingSafeEqual(providedHash, storedHash)) {
      return response.unauthorized({ message: 'Incorrect password' })
    }

    // Generate a session token (HMAC-signed, 30min TTL)
    const sessionData = {
      tokenHash,
      exp: Date.now() + 30 * 60 * 1000, // 30 minutes
    }
    const sessionPayload = Buffer.from(JSON.stringify(sessionData)).toString('base64url')
    const hmac = crypto
      .createHmac('sha256', encryptionService.hash('session-key'))
      .update(sessionPayload)
      .digest('base64url')

    const sessionToken = `${sessionPayload}.${hmac}`

    return response.ok({
      message: 'Password verified',
      sessionToken,
    })
  }
}
