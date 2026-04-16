import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import InvoiceSetting from '#models/team/invoice_setting'
import EinvoicingSubmission from '#models/einvoicing/einvoicing_submission'
import { checkStatus, buildPdpConfig } from '#services/einvoicing/pdp_service'
import {
  decryptModelFields,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'

export default class CheckStatus {
  async handle(ctx: HttpContext) {
    const { auth, params, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const submission = await EinvoicingSubmission.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .first()

    if (!submission) {
      return response.notFound({ message: 'Soumission non trouvee' })
    }

    if (!submission.trackingId) {
      return response.ok({
        submission: {
          id: submission.id,
          status: submission.status,
          statusMessage: submission.statusMessage,
          trackingId: null,
        },
        message: 'Aucun tracking ID disponible',
      })
    }

    if (['accepted', 'delivered'].includes(submission.status)) {
      return response.ok({
        submission: {
          id: submission.id,
          status: submission.status,
          statusMessage: submission.statusMessage,
          trackingId: submission.trackingId,
          lifecycleEvents: submission.lifecycleEvents,
        },
        message: 'Statut final atteint',
      })
    }

    const invoiceSettings = await InvoiceSetting.query().where('team_id', teamId).first()
    if (!invoiceSettings) {
      return response.badRequest({ message: 'Parametres de facturation introuvables' })
    }

    decryptModelFields(invoiceSettings, [...ENCRYPTED_FIELDS.invoiceSetting], dek)
    const pdpConfig = buildPdpConfig(invoiceSettings)

    const result = await checkStatus(pdpConfig, submission.trackingId)

    const previousStatus = submission.status
    const newStatus = result.status as typeof submission.status

    if (newStatus !== previousStatus) {
      submission.status = newStatus
      submission.statusMessage = result.message
      submission.addLifecycleEvent(newStatus, result.message)
    }

    submission.lastCheckedAt = DateTime.now()
    await submission.save()

    return response.ok({
      submission: {
        id: submission.id,
        status: submission.status,
        statusMessage: submission.statusMessage,
        trackingId: submission.trackingId,
        previousStatus,
        changed: newStatus !== previousStatus,
        lifecycleEvents: submission.lifecycleEvents,
        lastCheckedAt: submission.lastCheckedAt?.toISO(),
      },
    })
  }
}
