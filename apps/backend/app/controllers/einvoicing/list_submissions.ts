import type { HttpContext } from '@adonisjs/core/http'
import EinvoicingSubmission from '#models/einvoicing/einvoicing_submission'

export default class ListSubmissions {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const status = request.input('status')
    const documentType = request.input('document_type')

    let query = EinvoicingSubmission.query()
      .where('team_id', teamId)
      .orderBy('created_at', 'desc')

    if (status) {
      query = query.where('status', status)
    }

    if (documentType) {
      query = query.where('document_type', documentType)
    }

    const submissions = await query.paginate(page, limit)

    return response.ok({
      submissions: submissions.all().map((s) => ({
        id: s.id,
        documentType: s.documentType,
        documentId: s.documentId,
        documentNumber: s.documentNumber,
        provider: s.provider,
        trackingId: s.trackingId,
        status: s.status,
        statusMessage: s.statusMessage,
        submittedAt: s.submittedAt?.toISO(),
        lastCheckedAt: s.lastCheckedAt?.toISO(),
        lifecycleEvents: s.lifecycleEvents,
        createdAt: s.createdAt.toISO(),
      })),
      meta: submissions.getMeta(),
    })
  }
}
