import type { HttpContext } from '@adonisjs/core/http'
import EmailLog from '#models/email/email_log'
import { decryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'

export default class ListEmailLogs {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const documentType = request.qs().documentType as string | undefined
    const documentId = request.qs().documentId as string | undefined

    const query = EmailLog.query()
      .where('team_id', teamId)
      .orderBy('created_at', 'desc')

    if (documentType) {
      query.where('document_type', documentType)
    }
    if (documentId) {
      query.where('document_id', documentId)
    }

    const logs = await query.limit(50)

    // Decrypt sensitive fields
    for (const log of logs) {
      decryptModelFields(log, [...ENCRYPTED_FIELDS.emailLog], dek)
    }

    return response.ok({
      emailLogs: logs.map((log) => ({
        id: log.id,
        documentType: log.documentType,
        documentId: log.documentId,
        documentNumber: log.documentNumber,
        fromEmail: log.fromEmail,
        toEmail: log.toEmail,
        subject: log.subject,
        status: log.status,
        errorMessage: log.errorMessage,
        emailType: log.emailType,
        createdAt: log.createdAt.toISO(),
      })),
    })
  }
}
