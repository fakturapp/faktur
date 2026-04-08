import type { HttpContext } from '@adonisjs/core/http'
import { ingestValidator } from '#validators/analytics_validator'
import { ingestAnalytics } from '#services/analytics/analytics_ingestion_service'

export default class AnalyticsIngest {
  async handle({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(ingestValidator)

    if (!payload.consentAnalytics) {
      return response.ok({ ok: true })
    }

    let userId: string | null = null
    try {
      await auth.use('api').check()
      userId = auth.use('api').user?.id || null
    } catch {
    }

    const ip = request.ip()
    const userAgent = request.header('user-agent') || ''

    try {
      await ingestAnalytics(payload, ip, userAgent, userId)
    } catch {
    }

    return response.ok({ ok: true })
  }
}
