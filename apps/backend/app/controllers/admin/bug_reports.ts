import type { HttpContext } from '@adonisjs/core/http'
import BugReport from '#models/admin/bug_report'

export default class BugReports {
  async index({ response }: HttpContext) {
    const bugReports = await BugReport.query().preload('user').orderBy('createdAt', 'desc')

    return response.ok({
      bugReports: bugReports.map((b) => ({
        id: b.id,
        subject: b.subject,
        description: b.description,
        stepsToReproduce: b.stepsToReproduce,
        severity: b.severity,
        status: b.status,
        createdAt: b.createdAt.toISO(),
        user: {
          id: b.user.id,
          fullName: b.user.fullName,
          email: b.user.email,
          avatarUrl: b.user.avatarUrl,
        },
      })),
    })
  }

  async update({ params, request, response }: HttpContext) {
    const bugReport = await BugReport.find(params.id)
    if (!bugReport) {
      return response.notFound({ message: 'Bug report not found' })
    }

    const { status } = request.only(['status'])
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed']

    if (!validStatuses.includes(status)) {
      return response.badRequest({ message: 'Statut invalide' })
    }

    bugReport.status = status
    await bugReport.save()

    return response.ok({ bugReport })
  }
}
