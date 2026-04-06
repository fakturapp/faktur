import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Invoice from '#models/invoice/invoice'
import { broadcastDocumentSaved } from '#services/collaboration/websocket_service'

export default class UpdateStatus {
  async handle({ auth, params, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const { status, paidDate, paymentDate, paymentMethod, notes } = request.only([
      'status',
      'paidDate',
      'paymentDate',
      'paymentMethod',
      'notes',
    ])
    const validStatuses = ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled']

    if (!validStatuses.includes(status)) {
      return response.badRequest({ message: 'Invalid status' })
    }

    // paid_unconfirmed can only be set through the payment link flow
    if (status === 'paid_unconfirmed') {
      return response.forbidden({ message: 'This status can only be set through the payment link flow' })
    }

    const invoice = await Invoice.query().where('id', params.id).where('team_id', teamId).first()

    if (!invoice) {
      return response.notFound({ message: 'Invoice not found' })
    }

    invoice.status = status

    if (status === 'paid') {
      if (paidDate && typeof paidDate === 'string') {
        invoice.paidDate = paidDate
      } else {
        invoice.paidDate = DateTime.now().toFormat('yyyy-MM-dd')
      }
    } else if (status !== 'partial') {
      invoice.paidDate = null
    }

    await invoice.save()
    broadcastDocumentSaved('invoice', invoice.id, user.id)

    // When manually setting to 'paid', prompt frontend to show extra info modal
    const promptExtraInfo = status === 'paid'

    return response.ok({
      invoice: {
        id: invoice.id,
        status: invoice.status,
        paidDate: invoice.paidDate,
        paymentDate: paymentDate || null,
        paymentMethod: paymentMethod || null,
        notes: notes || null,
      },
      promptExtraInfo,
    })
  }
}
