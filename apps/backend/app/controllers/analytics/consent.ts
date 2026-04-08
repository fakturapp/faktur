import type { HttpContext } from '@adonisjs/core/http'
import { consentValidator } from '#validators/analytics_validator'
import CookieConsent from '#models/analytics/cookie_consent'
import analyticsEncryption from '#services/analytics/analytics_encryption_service'

export default class AnalyticsConsent {
  async handle({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(consentValidator)

    let userId: string | null = null
    try {
      await auth.use('api').check()
      userId = auth.use('api').user?.id || null
    } catch {
    }

    const ip = request.ip()
    const userAgent = request.header('user-agent') || ''

    await CookieConsent.create({
      userId,
      visitorId: payload.visitorId,
      consentAnalytics: payload.consentAnalytics,
      consentEssential: payload.consentEssential,
      ipAddressEncrypted: analyticsEncryption.encrypt(ip),
      userAgentEncrypted: analyticsEncryption.encrypt(userAgent),
      action: payload.action,
    })

    return response.ok({ ok: true })
  }
}
