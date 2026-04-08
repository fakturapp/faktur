import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import vine from '@vinejs/vine'
import Invoice from '#models/invoice/invoice'
import EmailAccount from '#models/email/email_account'
import EmailLog from '#models/email/email_log'
import PaymentReminder from '#models/reminder/payment_reminder'
import PaymentReminderSetting from '#models/reminder/payment_reminder_setting'
import GmailOAuthService from '#services/email/gmail_oauth_service'
import ResendUserService from '#services/email/resend_user_service'
import SmtpService from '#services/email/smtp_service'
import { generateInvoicePdf } from '#services/pdf/document_pdf_service'
import {
  encryptModelFields,
  decryptModelFields,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'

const sendReminderValidator = vine.compile(
  vine.object({
    emailAccountId: vine.string().trim().optional(),
    to: vine.string().trim().email().optional(),
    subject: vine.string().trim().maxLength(500).optional(),
    body: vine.string().trim().optional(),
  })
)

function applyTemplate(template: string, vars: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, value)
  }
  return result
}

export default class SendReminder {
  async handle(ctx: HttpContext) {
    const { auth, params, request, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const invoice = await Invoice.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .preload('client')
      .first()

    if (!invoice) {
      return response.notFound({ message: 'Invoice not found' })
    }

    if (invoice.status === 'paid' || invoice.status === 'cancelled' || invoice.status === 'draft') {
      return response.badRequest({ message: 'Cannot send reminder for this invoice status' })
    }

    // Decrypt client fields to get email
    if (invoice.client) {
      decryptModelFields(invoice.client, [...ENCRYPTED_FIELDS.client], dek)
    }

    const payload = await request.validateUsing(sendReminderValidator)

    // Get reminder settings for defaults
    const settings = await PaymentReminderSetting.query().where('team_id', teamId).first()

    // Determine email account
    const emailAccountId = payload.emailAccountId || settings?.emailAccountId
    if (!emailAccountId) {
      return response.badRequest({ message: 'No email account configured for reminders' })
    }

    const emailAccount = await EmailAccount.query()
      .where('id', emailAccountId)
      .where('team_id', teamId)
      .first()

    if (!emailAccount) {
      return response.notFound({ message: 'Email account not found' })
    }

    // Determine recipient
    const toEmail = payload.to || invoice.client?.email
    if (!toEmail) {
      return response.badRequest({ message: 'No recipient email address' })
    }

    // Build template variables
    const templateVars: Record<string, string> = {
      numero: invoice.invoiceNumber,
      montant: `${Number(invoice.total).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
      date_echeance: invoice.dueDate || '',
      date_emission: invoice.issueDate,
      client: invoice.client?.displayName || '',
    }

    const defaultSubject = `Rappel : Facture ${invoice.invoiceNumber} en attente de paiement`
    const defaultBody = `Bonjour,\n\nNous vous rappelons que la facture ${invoice.invoiceNumber} d'un montant de ${templateVars.montant} est arrivee a echeance le ${templateVars.date_echeance}.\n\nMerci de bien vouloir proceder au reglement.\n\nCordialement`

    const emailSubject =
      payload.subject ||
      (settings?.emailSubjectTemplate
        ? applyTemplate(settings.emailSubjectTemplate, templateVars)
        : defaultSubject)
    const emailBody =
      payload.body ||
      (settings?.emailBodyTemplate
        ? applyTemplate(settings.emailBodyTemplate, templateVars)
        : defaultBody)

    let pdfBuffer: Buffer
    let filename: string
    try {
      const result = await generateInvoicePdf(invoice.id, teamId, dek)
      pdfBuffer = result.pdfBuffer
      filename = result.filename
    } catch {
      return response.internalServerError({ message: 'Failed to generate PDF' })
    }

    const attachments = [{ filename, content: pdfBuffer, mimeType: 'application/pdf' }]

    let sendError: string | null = null
    try {
      if (emailAccount.provider === 'gmail') {
        const accessToken = await GmailOAuthService.getValidAccessToken(emailAccount)
        if (emailAccount.$isDirty) await emailAccount.save()
        await GmailOAuthService.sendEmail({
          accessToken,
          from: emailAccount.email,
          fromName: emailAccount.displayName,
          to: toEmail,
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
          to: toEmail,
          subject: emailSubject,
          body: emailBody,
          attachments,
        })
      } else if (emailAccount.provider === 'smtp') {
        if (
          !emailAccount.smtpHost ||
          !emailAccount.smtpPort ||
          !emailAccount.smtpUsername ||
          !emailAccount.smtpPassword
        ) {
          throw new Error('SMTP config incomplete')
        }
        await SmtpService.sendEmail({
          host: emailAccount.smtpHost,
          port: emailAccount.smtpPort,
          encryptedUsername: emailAccount.smtpUsername,
          encryptedPassword: emailAccount.smtpPassword,
          from: emailAccount.email,
          fromName: emailAccount.displayName,
          to: toEmail,
          subject: emailSubject,
          body: emailBody,
          attachments,
        })
      }
    } catch (err) {
      sendError = err instanceof Error ? err.message : 'Unknown error'
    }

    const logData: Record<string, any> = {
      teamId,
      documentType: 'invoice',
      documentId: invoice.id,
      documentNumber: invoice.invoiceNumber,
      fromEmail: emailAccount.email,
      toEmail,
      subject: emailSubject,
      body: emailBody,
      status: sendError ? 'error' : 'sent',
      errorMessage: sendError,
      emailType: 'reminder',
    }
    encryptModelFields(logData, [...ENCRYPTED_FIELDS.emailLog], dek)
    await EmailLog.create(logData)

    await PaymentReminder.create({
      teamId,
      invoiceId: invoice.id,
      type: 'manual',
      status: sendError ? 'error' : 'sent',
      toEmail,
      errorMessage: sendError,
      sentAt: DateTime.now(),
    })

    if (sendError) {
      return response.internalServerError({ message: `Reminder failed: ${sendError}` })
    }

    // Update invoice to overdue if sent+past due
    if (invoice.status === 'sent' && invoice.dueDate) {
      const today = new Date().toISOString().slice(0, 10)
      if (invoice.dueDate < today) {
        invoice.status = 'overdue'
        await invoice.save()
      }
    }

    return response.ok({ message: 'Reminder sent successfully' })
  }
}
