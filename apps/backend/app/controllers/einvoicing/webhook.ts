import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import EinvoicingSubmission from '#models/einvoicing/einvoicing_submission'
import WebhookService from '#services/security/webhook_service'
import { ApiError } from '#exceptions/api_error'

function mapB2BState(
  state: string
): 'pending' | 'submitted' | 'accepted' | 'rejected' | 'delivered' | 'error' {
  switch (state) {
    case 'new':
      return 'pending'
    case 'sending':
    case 'sent':
      return 'submitted'
    case 'registered':
    case 'accepted':
    case 'allegedly_paid':
      return 'accepted'
    case 'refused':
      return 'rejected'
    case 'delivered':
      return 'delivered'
    case 'error':
      return 'error'
    default:
      return 'pending'
  }
}

export default class B2BRouterWebhook {
  async handle(ctx: HttpContext) {
    const { request, response } = ctx
    const secret = env.get('B2BROUTER_WEBHOOK_SECRET')
    const signature = request.header('x-b2brouter-signature') ?? ''
    const timestamp = request.header('x-b2brouter-timestamp') ?? ''
    const rawBody = request.raw() ?? JSON.stringify(request.body() ?? {})

    if (!secret) {
      if (app.inProduction) {
        logger.error('B2BROUTER_WEBHOOK_SECRET missing in production')
        throw new ApiError('einvoicing_signature_invalid')
      }
      logger.warn('B2BROUTER_WEBHOOK_SECRET missing; skipping signature verification (non-production)')
    } else {
      if (!signature || !timestamp) {
        throw new ApiError('einvoicing_signature_invalid')
      }
      const verification = WebhookService.verifyWithReplayProtection(
        rawBody,
        signature,
        timestamp,
        secret,
        300
      )
      if (!verification.valid) {
        logger.warn({ reason: verification.reason }, 'B2Brouter webhook signature invalid')
        throw new ApiError('einvoicing_signature_invalid')
      }
    }

    const body = request.body()
    const event = body.event
    const invoiceId = body.invoice_id
    const taxReportId = body.tax_report_id
    const state = body.state
    const previousState = body.previous_state
    const bodyTimestamp = body.timestamp || new Date().toISOString()

    if (event === 'invoice.state_changed' && invoiceId) {
      const submission = await EinvoicingSubmission.query()
        .where('tracking_id', String(invoiceId))
        .orWhere('external_id', String(invoiceId))
        .first()

      if (submission) {
        const newStatus = mapB2BState(state)
        if (submission.status !== newStatus) {
          submission.status = newStatus
          submission.statusMessage = `B2Brouter: ${previousState} -> ${state}`
          submission.lastCheckedAt = DateTime.now()
          submission.addLifecycleEvent(newStatus, `Webhook: ${state} (was ${previousState})`)
          await submission.save()
        }
      }

      return response.ok({ received: true, event, invoiceId })
    }

    if (event === 'tax_report.state_changed' && taxReportId) {
      return response.ok({ received: true, event, taxReportId, state, timestamp: bodyTimestamp })
    }

    return response.ok({ received: true, event: event || 'unknown' })
  }
}
