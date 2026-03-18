import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Invoice from '#models/invoice/invoice'

export default class UpdateStatus {
  async handle({ auth, params, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const { status } = request.only(['status'])
    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled']

    if (!validStatuses.includes(status)) {
      return response.badRequest({ message: 'Invalid status' })
    }

    const invoice = await Invoice.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .first()

    if (!invoice) {
      return response.notFound({ message: 'Invoice not found' })
    }

    invoice.status = status

    if (status === 'paid') {
      invoice.paidDate = DateTime.now().toISO()
    } else {
      invoice.paidDate = null as any
    }

    await invoice.save()

    return response.ok({ invoice: { id: invoice.id, status: invoice.status } })
  }
}
