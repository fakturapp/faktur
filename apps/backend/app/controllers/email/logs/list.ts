import type { HttpContext } from '@adonisjs/core/http'
import EmailLog from '#models/email/email_log'

export default class ListEmailLogs {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

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
