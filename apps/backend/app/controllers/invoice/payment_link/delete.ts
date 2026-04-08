import type { HttpContext } from '@adonisjs/core/http'
import PaymentLink from '#models/invoice/payment_link'
import r2StorageService from '#services/storage/r2_storage_service'

export default class Delete {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const paymentLink = await PaymentLink.query()
      .where('invoice_id', params.invoiceId)
      .where('team_id', teamId)
      .where('is_active', true)
      .first()

    if (!paymentLink) {
      return response.notFound({ message: 'No active payment link found' })
    }

    if (paymentLink.pdfStorageKey) {
      try {
        await r2StorageService.delete(paymentLink.pdfStorageKey)
      } catch {
      }
    }

    paymentLink.isActive = false
    paymentLink.encryptedIban = null
    paymentLink.encryptedBic = null
    paymentLink.encryptedBankName = null
    paymentLink.pdfData = null
    paymentLink.pdfStorageKey = null

    await paymentLink.save()

    return response.ok({ message: 'Payment link deactivated' })
  }
}
