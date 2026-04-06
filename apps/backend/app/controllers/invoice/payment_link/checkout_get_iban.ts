import type { HttpContext } from '@adonisjs/core/http'
import crypto from 'node:crypto'
import PaymentLink from '#models/invoice/payment_link'
import encryptionService from '#services/encryption/encryption_service'

export default class CheckoutGetIban {
  async handle({ params, request, response }: HttpContext) {
    response.header('X-Robots-Tag', 'noindex, nofollow')
    response.header('Cache-Control', 'no-store, no-cache, must-revalidate')

    const tokenHash = encryptionService.hash(params.token)

    const paymentLink = await PaymentLink.query()
      .where('token_hash', tokenHash)
      .where('is_active', true)
      .first()

    if (!paymentLink || paymentLink.isExpired) {
      return response.notFound({ message: 'Payment link not found or expired' })
    }

    // If already paid, IBAN should not be accessible
    if (paymentLink.paidAt) {
      return response.forbidden({ message: 'Payment already marked as sent, IBAN is no longer accessible' })
    }

    if (!paymentLink.showIban) {
      return response.forbidden({ message: 'IBAN display is disabled for this link' })
    }

    // Verify session token if password-protected
    if (paymentLink.passwordHash) {
      const sessionToken = request.header('X-Checkout-Session')

      if (!sessionToken) {
        return response.unauthorized({ message: 'Session token required' })
      }

      const [payload, hmac] = sessionToken.split('.')
      if (!payload || !hmac) {
        return response.unauthorized({ message: 'Invalid session token' })
      }

      // Verify HMAC
      const expectedHmac = crypto
        .createHmac('sha256', encryptionService.hash('session-key'))
        .update(payload)
        .digest('base64url')

      if (!encryptionService.timingSafeEqual(hmac, expectedHmac)) {
        return response.unauthorized({ message: 'Invalid session token' })
      }

      // Check expiry and token match
      try {
        const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
        if (data.exp < Date.now()) {
          return response.unauthorized({ message: 'Session expired' })
        }
        if (data.tokenHash !== tokenHash) {
          return response.unauthorized({ message: 'Session mismatch' })
        }
      } catch {
        return response.unauthorized({ message: 'Invalid session token' })
      }
    }

    // Decrypt IBAN (app-level encryption)
    let iban: string | null = null
    let bic: string | null = null
    let bankName: string | null = null

    try {
      if (paymentLink.encryptedIban) {
        iban = encryptionService.decrypt(paymentLink.encryptedIban)
      }
      if (paymentLink.encryptedBic) {
        bic = encryptionService.decrypt(paymentLink.encryptedBic)
      }
      if (paymentLink.encryptedBankName) {
        const raw = encryptionService.decrypt(paymentLink.encryptedBankName)
        // Fix double-encoded UTF-8 (latin1 → utf8 corruption)
        try {
          bankName = Buffer.from(raw, 'latin1').toString('utf8')
          // If the result looks worse (contains replacement chars), use the original
          if (bankName.includes('\ufffd')) bankName = raw
        } catch {
          bankName = raw
        }
      }
    } catch {
      return response.internalServerError({ message: 'Failed to decrypt payment information' })
    }

    // Format IBAN for display (groups of 4)
    const formattedIban = iban ? iban.replace(/(.{4})/g, '$1 ').trim() : null

    response.header('Content-Type', 'application/json; charset=utf-8')
    return response.ok({
      iban: formattedIban,
      ibanRaw: iban,
      bic,
      bankName,
    })
  }
}
