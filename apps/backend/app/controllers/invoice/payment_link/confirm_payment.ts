import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Invoice from '#models/invoice/invoice'
import PaymentLink from '#models/invoice/payment_link'
import { confirmPaymentValidator } from '#validators/payment_link_validator'
import { encryptModelFields } from '#services/crypto/field_encryption_helper'
import encryptionService from '#services/encryption/encryption_service'
import r2StorageService from '#services/storage/r2_storage_service'
import { broadcastDocumentSaved } from '#services/collaboration/websocket_service'
import { PaymentConfirmedNotification } from '#mails/payment_confirmed_notification'
import mail from '@adonisjs/mail/services/main'

export default class ConfirmPayment {
  async handle(ctx: HttpContext) {
    const { auth, params, request, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const invoice = await Invoice.query()
      .where('id', params.invoiceId)
      .where('team_id', teamId)
      .first()

    if (!invoice) {
      return response.notFound({ message: 'Invoice not found' })
    }

    if (invoice.status !== 'paid_unconfirmed') {
      return response.badRequest({ message: 'Invoice is not in paid_unconfirmed status' })
    }

    const paymentLink = await PaymentLink.query()
      .where('invoice_id', invoice.id)
      .where('team_id', teamId)
      .first()

    if (!paymentLink) {
      return response.notFound({ message: 'Payment link not found' })
    }

    const payload = await request.validateUsing(confirmPaymentValidator)

    invoice.status = 'paid'
    invoice.paidDate = payload.paymentDate || DateTime.now().toFormat('yyyy-MM-dd')
    await invoice.save()

    paymentLink.confirmedAt = DateTime.now()
    paymentLink.confirmedByUserId = user.id
    paymentLink.isActive = false

    const confirmData: Record<string, any> = {
      confirmationDate: payload.paymentDate || null,
      confirmationNotes: payload.notes || null,
    }
    encryptModelFields(confirmData, ['confirmationDate', 'confirmationNotes'] as any, dek)
    paymentLink.confirmationDate = confirmData.confirmationDate
    paymentLink.confirmationNotes = confirmData.confirmationNotes

    if (paymentLink.pdfStorageKey) {
      try {
        await r2StorageService.delete(paymentLink.pdfStorageKey)
      } catch {
      }
    }

    paymentLink.encryptedIban = null
    paymentLink.encryptedBic = null
    paymentLink.encryptedBankName = null
    paymentLink.pdfData = null
    paymentLink.pdfStorageKey = null

    await paymentLink.save()

    const linkId = paymentLink.id
    setTimeout(async () => {
      try {
        const link = await PaymentLink.find(linkId)
        if (link) await link.delete()
      } catch { }
    }, 5 * 60 * 1000)

    if (payload.notifyClient && paymentLink.clientEmail) {
      try {
        const clientEmail = encryptionService.decrypt(paymentLink.clientEmail)
        let clientName: string | undefined
        if (paymentLink.clientName) {
          try {
            clientName = encryptionService.decrypt(paymentLink.clientName)
          } catch {
          }
        }
        await mail.send(
          new PaymentConfirmedNotification(clientEmail, paymentLink.invoiceNumber, clientName)
        )
      } catch {
      }
    }

    broadcastDocumentSaved('invoice', invoice.id, user.id)

    return response.ok({
      message: 'Payment confirmed',
      invoice: { id: invoice.id, status: invoice.status, paidDate: invoice.paidDate },
    })
  }
}
