import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { reviewAppealValidator } from '#validators/email_blocklist_validator'
import EmailAppeal from '#models/security/email_appeal'
import EmailBlocklistService from '#services/security/email_blocklist_service'

export default class EmailAppealsAdmin {
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const status = request.input('status', '')

    const query = EmailAppeal.query().orderBy('createdAt', 'desc')

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.where('status', status)
    }

    const appeals = await query.paginate(page, 20)

    return response.ok({
      appeals: appeals.serialize(),
    })
  }

  async update({ params, request, response }: HttpContext) {
    const appeal = await EmailAppeal.find(params.id)
    if (!appeal) {
      return response.notFound({ message: 'Demande introuvable.' })
    }

    if (appeal.status !== 'pending') {
      return response.badRequest({ message: 'Cette demande a déjà été traitée.' })
    }

    const data = await request.validateUsing(reviewAppealValidator)

    appeal.status = data.status
    appeal.adminNote = data.adminNote || null
    appeal.reviewedAt = DateTime.now()
    await appeal.save()

    // If approved, allow the domain
    if (data.status === 'approved') {
      await EmailBlocklistService.allowDomain(
        appeal.domain,
        `Approuvé via appel de ${appeal.email}`
      )
    }

    return response.ok({
      message:
        data.status === 'approved'
          ? `Le domaine ${appeal.domain} a été débloqué.`
          : `La demande a été rejetée.`,
      appeal,
    })
  }
}
