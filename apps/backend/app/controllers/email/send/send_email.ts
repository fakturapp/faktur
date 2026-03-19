import type { HttpContext } from '@adonisjs/core/http'
import { readFile } from 'node:fs/promises'
import vine from '@vinejs/vine'
import EmailAccount from '#models/email/email_account'
import EmailLog from '#models/email/email_log'
import Invoice from '#models/invoice/invoice'
import Quote from '#models/quote/quote'
import GmailOAuthService from '#services/email/gmail_oauth_service'
import ResendUserService from '#services/email/resend_user_service'
import { generateInvoicePdf, generateQuotePdf } from '#services/pdf/document_pdf_service'
import { encryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'

const sendEmailValidator = vine.compile(
  vine.object({
    documentType: vine.enum(['invoice', 'quote']),
    documentId: vine.string().trim(),
    emailAccountId: vine.string().trim(),
    to: vine.string().trim().email(),
    subject: vine.string().trim().minLength(1).maxLength(500),
    body: vine.string().trim().minLength(1),
    emailType: vine.enum(['send', 'reminder']).optional(),
  })
)

export default class SendEmail {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const payload = await request.validateUsing(sendEmailValidator)

    // Verify email account ownership
    const emailAccount = await EmailAccount.query()
      .where('id', payload.emailAccountId)
      .where('team_id', teamId)
      .first()

    if (!emailAccount) {
      return response.notFound({ message: 'Email account not found' })
    }

    if (!['gmail', 'resend'].includes(emailAccount.provider)) {
      return response.badRequest({ message: 'Provider non supporté' })
    }

    // Generate PDF
    let pdfBuffer: Buffer
    let filename: string
    try {
      if (payload.documentType === 'invoice') {
        const result = await generateInvoicePdf(payload.documentId, teamId, dek)
        pdfBuffer = result.pdfBuffer
        filename = result.filename
      } else {
        const result = await generateQuotePdf(payload.documentId, teamId, dek)
        pdfBuffer = result.pdfBuffer
        filename = result.filename
      }
    } catch {
      return response.notFound({ message: 'Document not found' })
    }

    // For Gmail: get valid access token (refresh if needed)
    let accessToken: string | undefined
    if (emailAccount.provider === 'gmail') {
      try {
        accessToken = await GmailOAuthService.getValidAccessToken(emailAccount)
        if (emailAccount.$isDirty) {
          await emailAccount.save()
        }
      } catch {
        return response.badRequest({
          message: 'Impossible de se connecter à Gmail. Veuillez reconnecter votre compte.',
        })
      }
    }

    // Resolve document number for logging
    let documentNumber = ''
    if (payload.documentType === 'invoice') {
      const inv = await Invoice.query().where('id', payload.documentId).where('team_id', teamId).first()
      documentNumber = inv?.invoiceNumber || payload.documentId
    } else {
      const q = await Quote.query().where('id', payload.documentId).where('team_id', teamId).first()
      documentNumber = q?.quoteNumber || payload.documentId
    }

    // Collect all attachments: auto-generated PDF + user-uploaded files
    const allAttachments: { filename: string; content: Buffer; mimeType: string }[] = [
      { filename, content: pdfBuffer, mimeType: 'application/pdf' },
    ]

    const uploadedFiles = request.files('attachments', { size: '10mb' })
    for (const file of uploadedFiles) {
      if (file.tmpPath) {
        const content = await readFile(file.tmpPath)
        allAttachments.push({
          filename: file.clientName,
          content,
          mimeType: file.headers['content-type'] || 'application/octet-stream',
        })
      }
    }

    // Send email via the appropriate provider
    try {
      if (emailAccount.provider === 'gmail') {
        await GmailOAuthService.sendEmail({
          accessToken: accessToken!,
          from: emailAccount.email,
          fromName: emailAccount.displayName,
          to: payload.to,
          subject: payload.subject,
          body: payload.body,
          attachments: allAttachments,
        })
      } else if (emailAccount.provider === 'resend') {
        if (!emailAccount.accessToken) {
          throw new Error('Clé API Resend manquante')
        }
        await ResendUserService.sendEmail({
          encryptedApiKey: emailAccount.accessToken,
          from: emailAccount.email,
          fromName: emailAccount.displayName,
          to: payload.to,
          subject: payload.subject,
          body: payload.body,
          attachments: allAttachments,
        })
      }
    } catch (err) {
      // Log the failed email (encrypt sensitive fields)
      const failedLogData: Record<string, any> = {
        teamId,
        documentType: payload.documentType,
        documentId: payload.documentId,
        documentNumber,
        fromEmail: emailAccount.email,
        toEmail: payload.to,
        subject: payload.subject,
        body: payload.body,
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        emailType: payload.emailType || 'send',
      }
      encryptModelFields(failedLogData, [...ENCRYPTED_FIELDS.emailLog], dek)
      await EmailLog.create(failedLogData)

      return response.internalServerError({
        message: "Erreur lors de l'envoi de l'email. Veuillez réessayer.",
      })
    }

    // Log the successful email (encrypt sensitive fields)
    const successLogData: Record<string, any> = {
      teamId,
      documentType: payload.documentType,
      documentId: payload.documentId,
      documentNumber,
      fromEmail: emailAccount.email,
      toEmail: payload.to,
      subject: payload.subject,
      body: payload.body,
      status: 'sent',
      emailType: payload.emailType || 'send',
    }
    encryptModelFields(successLogData, [...ENCRYPTED_FIELDS.emailLog], dek)
    await EmailLog.create(successLogData)

    // Update document status to 'sent' if currently 'draft'
    if (payload.documentType === 'invoice') {
      const invoice = await Invoice.query()
        .where('id', payload.documentId)
        .where('team_id', teamId)
        .first()
      if (invoice && invoice.status === 'draft') {
        invoice.status = 'sent'
        await invoice.save()
      }
    } else {
      const quote = await Quote.query()
        .where('id', payload.documentId)
        .where('team_id', teamId)
        .first()
      if (quote && quote.status === 'draft') {
        quote.status = 'sent'
        await quote.save()
      }
    }

    return response.ok({ message: 'Email envoyé avec succès' })
  }
}
