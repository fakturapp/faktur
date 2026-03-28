import type { HttpContext } from '@adonisjs/core/http'
import { ingestValidator } from '#validators/analytics_validator'
import { ingestAnalytics } from '#services/analytics/analytics_ingestion_service'

export default class AnalyticsIngest {
  async handle({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(ingestValidator)

    // Respect consent — if analytics not consented, return 200 silently
    if (!payload.consentAnalytics) {
      return response.ok({ ok: true })
    }

    // Optional auth: link to user if authenticated
    let userId: string | null = null
    try {
      await auth.use('api').check()
      userId = auth.use('api').user?.id || null
    } catch {
      // Not authenticated — fine, track anonymously
    }

    const ip = request.ip()
    const userAgent = request.header('user-agent') || ''

    await ingestAnalytics(payload, ip, userAgent, userId)

    return response.ok({ ok: true })
  }
}
