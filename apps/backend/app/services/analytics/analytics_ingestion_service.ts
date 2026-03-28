import { DateTime } from 'luxon'
import AnalyticsSession from '#models/analytics/analytics_session'
import AnalyticsEvent from '#models/analytics/analytics_event'
import AnalyticsError from '#models/analytics/analytics_error'
import AnalyticsPerformance from '#models/analytics/analytics_performance'
import analyticsEncryption from '#services/analytics/analytics_encryption_service'
import { parseUserAgent } from '#services/analytics/user_agent_parser'
import { getGeoFromIp } from '#services/analytics/geo_cache'

/** Replace UUIDs in paths with [id] for aggregation */
function sanitizePath(path: string): string {
  return path.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    '[id]'
  )
}

interface IngestPayload {
  sessionId: string
  consentAnalytics: boolean
  screenWidth?: number
  screenHeight?: number
  language?: string
  referrer?: string
  events?: Array<{
    eventType: string
    eventName: string
    pagePath?: string
    pagePathFull?: string
    metadata?: any
    metadataSensitive?: any
    timestamp: string
  }>
  errors?: Array<{
    errorType: string
    errorMessage: string
    errorMessageFull?: string
    stackTrace?: string
    pagePath?: string
    timestamp: string
  }>
  performance?: Array<{
    metricName: string
    metricValue: number
    rating: string
    pagePath?: string
    connectionType?: string
    timestamp: string
  }>
}

export async function ingestAnalytics(
  payload: IngestPayload,
  ip: string,
  userAgent: string,
  userId: string | null
) {
  const sessionToken = analyticsEncryption.hash(payload.sessionId)
  const parsed = parseUserAgent(userAgent)
  const geo = await getGeoFromIp(ip)

  // Find or create session
  let session = await AnalyticsSession.findBy('sessionToken', sessionToken)

  if (!session) {
    const firstEventPath = payload.events?.[0]?.pagePath

    session = await AnalyticsSession.create({
      userId,
      sessionToken,
      startedAt: DateTime.now(),
      durationSeconds: 0,
      pageCount: 0,
      eventCount: 0,
      entryPage: firstEventPath ? sanitizePath(firstEventPath) : null,
      referrerEncrypted: payload.referrer ? analyticsEncryption.encrypt(payload.referrer) : null,
      ipAddressEncrypted: analyticsEncryption.encrypt(ip),
      ipHash: analyticsEncryption.hash(ip),
      userAgentEncrypted: analyticsEncryption.encrypt(userAgent),
      browser: parsed.browser,
      browserVersion: parsed.browserVersion,
      os: parsed.os,
      deviceType: parsed.deviceType,
      screenWidth: payload.screenWidth || null,
      screenHeight: payload.screenHeight || null,
      country: geo.country || null,
      countryNameEncrypted: geo.countryName ? analyticsEncryption.encrypt(geo.countryName) : null,
      cityEncrypted: geo.city ? analyticsEncryption.encrypt(geo.city) : null,
      language: payload.language || null,
      isAuthenticated: !!userId,
    })
  }

  // Batch insert events
  if (payload.events?.length) {
    const eventRows = payload.events.map((e) => ({
      sessionId: session!.id,
      userId,
      eventType: e.eventType,
      eventName: e.eventName,
      pagePath: e.pagePath ? sanitizePath(e.pagePath) : null,
      pagePathFullEncrypted: e.pagePathFull
        ? analyticsEncryption.encrypt(e.pagePathFull)
        : null,
      metadata: e.metadata || null,
      metadataEncrypted: e.metadataSensitive
        ? analyticsEncryption.encrypt(JSON.stringify(e.metadataSensitive))
        : null,
      timestamp: DateTime.fromISO(e.timestamp),
    }))

    await AnalyticsEvent.createMany(eventRows)

    // Update session counters
    const pageViews = payload.events.filter((e) => e.eventType === 'page_view').length
    session.pageCount += pageViews
    session.eventCount += payload.events.length

    // Update exit page
    const lastPageView = [...payload.events]
      .reverse()
      .find((e) => e.eventType === 'page_view')
    if (lastPageView?.pagePath) {
      session.exitPage = sanitizePath(lastPageView.pagePath)
    }
  }

  // Batch insert errors (with dedup by fingerprint)
  if (payload.errors?.length) {
    for (const err of payload.errors) {
      const fingerprint = analyticsEncryption.hash(
        `${err.errorType}:${err.errorMessage}:${err.pagePath || ''}`
      )

      const existing = await AnalyticsError.findBy('fingerprint', fingerprint)
      if (existing) {
        existing.occurrenceCount += 1
        await existing.save()
      } else {
        await AnalyticsError.create({
          sessionId: session.id,
          userId,
          errorType: err.errorType,
          errorMessage: err.errorMessage.slice(0, 255),
          errorMessageFullEncrypted: err.errorMessageFull
            ? analyticsEncryption.encrypt(err.errorMessageFull)
            : null,
          stackTraceEncrypted: err.stackTrace
            ? analyticsEncryption.encrypt(err.stackTrace)
            : null,
          pagePath: err.pagePath ? sanitizePath(err.pagePath) : null,
          browser: parsed.browser,
          os: parsed.os,
          occurrenceCount: 1,
          fingerprint,
          isResolved: false,
          timestamp: DateTime.fromISO(err.timestamp),
        })
      }
    }
  }

  // Batch insert performance metrics
  if (payload.performance?.length) {
    const perfRows = payload.performance.map((p) => ({
      sessionId: session!.id,
      userId,
      metricName: p.metricName,
      metricValue: p.metricValue,
      rating: p.rating,
      pagePath: p.pagePath ? sanitizePath(p.pagePath) : null,
      connectionType: p.connectionType || null,
      deviceType: parsed.deviceType,
      timestamp: DateTime.fromISO(p.timestamp),
    }))

    await AnalyticsPerformance.createMany(perfRows)
  }

  // Update session timing
  session.endedAt = DateTime.now()
  if (session.startedAt) {
    session.durationSeconds = Math.round(
      session.endedAt.diff(session.startedAt, 'seconds').seconds
    )
  }
  await session.save()
}
