import type { HttpContext } from '@adonisjs/core/http'
import Invoice from '#models/invoice/invoice'
import PaymentLink from '#models/invoice/payment_link'
import EmailAccount from '#models/email/email_account'
import EmailLog from '#models/email/email_log'
import { decryptModelFields, encryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'
import { generateInvoicePdf } from '#services/pdf/document_pdf_service'
import GmailOAuthService from '#services/email/gmail_oauth_service'
import ResendUserService from '#services/email/resend_user_service'
import SmtpService from '#services/email/smtp_service'
import { PaymentLinkNotification } from '#mails/payment_link_notification'
import { buildCheckoutUrl } from '#services/checkout/checkout_url_builder'

export default class SendLinkEmail {
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
      .preload('client')
      .first()

    if (!invoice) {
      return response.notFound({ message: 'Invoice not found' })
    }

    const paymentLink = await PaymentLink.query()
      .where('invoice_id', invoice.id)
      .where('team_id', teamId)
      .where('is_active', true)
      .first()

    if (!paymentLink) {
      return response.notFound({ message: 'No active payment link found' })
    }

    if (invoice.client) {
      decryptModelFields(invoice.client, [...ENCRYPTED_FIELDS.client], dek)
    }

    const clientEmail = invoice.client?.email
    if (!clientEmail) {
      return response.badRequest({ message: 'Client has no email address' })
    }

    const emailAccount = await EmailAccount.query()
      .where('team_id', teamId)
      .where('is_default', true)
      .where('is_active', true)
      .first()

    if (!emailAccount) {
      return response.badRequest({ message: 'No email account configured' })
    }

    decryptModelFields(emailAccount, ['accessToken', 'refreshToken', 'smtpHost', 'smtpUsername', 'smtpPassword'] as any, dek)

    const token = request.input('token')
    if (!token) {
      return response.badRequest({ message: 'Token is required to build the payment link URL' })
    }
    const paymentUrl = buildCheckoutUrl(token)

    let pdfBuffer: Buffer | null = null
    let pdfFilename = `${invoice.invoiceNumber}.pdf`
    try {
      const result = await generateInvoicePdf(invoice.id, teamId, dek)
      pdfBuffer = result.pdfBuffer
      pdfFilename = result.filename || pdfFilename
    } catch {
      // PDF generation failure should not block email
    }

    // Build email content
    const clientName = invoice.client?.displayName || 'Client'
    const notification = new PaymentLinkNotification(
      clientEmail,
      paymentUrl,
      invoice.invoiceNumber,
      Number(invoice.total),
      paymentLink.currency,
      clientName
    )

    const emailSubject = notification.getSubject()
    const emailBody = notification.getHtml()
    const attachments = pdfBuffer
      ? [{ filename: pdfFilename, content: pdfBuffer, mimeType: 'application/pdf' }]
      : []

    // Send email via the configured provider
    let sendError: string | null = null
    try {
      if (emailAccount.provider === 'gmail') {
        const accessToken = await GmailOAuthService.getValidAccessToken(emailAccount)
        if (emailAccount.$isDirty) await emailAccount.save()
        await GmailOAuthService.sendEmail({
          accessToken,
          from: emailAccount.email,
          fromName: emailAccount.displayName,
          to: clientEmail,
          subject: emailSubject,
          body: emailBody,
          attachments,
        })
      } else if (emailAccount.provider === 'resend') {
        if (!emailAccount.accessToken) throw new Error('Resend API key missing')
        await ResendUserService.sendEmail({
          encryptedApiKey: emailAccount.accessToken,
          from: emailAccount.email,
          fromName: emailAccount.displayName,
          to: clientEmail,
          subject: emailSubject,
          body: emailBody,
          attachments,
        })
      } else if (emailAccount.provider === 'smtp') {
        if (!emailAccount.smtpHost || !emailAccount.smtpPort || !emailAccount.smtpUsername || !emailAccount.smtpPassword) {
          throw new Error('SMTP config incomplete')
        }
        await SmtpService.sendEmail({
          host: emailAccount.smtpHost,
          port: emailAccount.smtpPort,
          encryptedUsername: emailAccount.smtpUsername,
          encryptedPassword: emailAccount.smtpPassword,
          from: emailAccount.email,
          fromName: emailAccount.displayName,
          to: clientEmail,
          subject: emailSubject,
          body: emailBody,
          attachments,
        })
      }
    } catch (err: any) {
      sendError = err.message || 'Unknown error'
    }

    // Log email
    const logData: Record<string, any> = {
      teamId,
      emailAccountId: emailAccount.id,
      documentType: 'invoice',
      documentId: invoice.id,
      documentNumber: invoice.invoiceNumber,
      fromEmail: emailAccount.email,
      toEmail: clientEmail,
      subject: emailSubject,
      body: emailBody,
      status: sendError ? 'error' : 'sent',
      errorMessage: sendError,
      emailType: 'payment_link',
    }
    encryptModelFields(logData, [...ENCRYPTED_FIELDS.emailLog], dek)
    await EmailLog.create(logData)

    if (sendError) {
      return response.internalServerError({ message: 'Failed to send email', error: sendError })
    }

    if (invoice.status === 'draft') {
      invoice.status = 'sent'
      await invoice.save()
    }

    return response.ok({ message: 'Payment link email sent', invoiceStatus: invoice.status })
  }
}
