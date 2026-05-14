import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Invoice from '#models/invoice/invoice'
import PaymentLink from '#models/invoice/payment_link'
import { broadcastDocumentSaved } from '#services/collaboration/websocket_service'
import { recordAuditEvent } from '#services/audit/audit_log_service'

export default class UpdateStatus {
  async handle(ctx: HttpContext) {
    const { auth, params, request, response } = ctx
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

    if (status === 'paid_unconfirmed') {
      return response.forbidden({ message: 'This status can only be set through the payment link flow' })
    }

    const invoice = await Invoice.query().where('id', params.id).where('team_id', teamId).first()

    if (!invoice) {
      return response.notFound({ message: 'Invoice not found' })
    }

    if (status === 'draft') {
      const activeLink = await PaymentLink.query()
        .where('invoice_id', invoice.id)
        .where('is_active', true)
        .first()
      if (activeLink) {
        return response.unprocessableEntity({
          message: 'Supprimez le lien de paiement avant de repasser la facture en brouillon.',
        })
      }
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

    await recordAuditEvent(ctx, {
      action: 'invoice.status_updated',
      resourceType: 'invoice',
      resourceId: invoice.id,
      metadata: {
        teamId,
        status,
        paidDate: invoice.paidDate,
        paymentDate: paymentDate || null,
        paymentMethod: paymentMethod || null,
      },
    })

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
