import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import AnalyticsError from '#models/analytics/analytics_error'
import analyticsEncryption from '#services/analytics/analytics_encryption_service'

export default class AnalyticsErrors {
  async handle({ request, response }: HttpContext) {
    const period = request.input('period', '7d')
    const startDate = this.getStartDate(period)

    const errors = await AnalyticsError.query()
      .where('timestamp', '>=', startDate.toSQL()!)
      .orderBy('occurrence_count', 'desc')

    const grouped = new Map<
      string,
      {
        fingerprint: string
        occurrenceCount: number
        errorType: string
        errorMessage: string
        pagePath: string
        browser: string | null
        os: string | null
        isResolved: boolean
        latestTimestamp: string
        ids: string[]
        errorMessageFullEncrypted: string | null
        stackTraceEncrypted: string | null
      }
    >()

    for (const error of errors) {
      const existing = grouped.get(error.fingerprint)
      if (existing) {
        existing.occurrenceCount += error.occurrenceCount
        if (error.timestamp.toISO()! > existing.latestTimestamp) {
          existing.latestTimestamp = error.timestamp.toISO()!
        }
        existing.ids.push(error.id)
      } else {
        grouped.set(error.fingerprint, {
          fingerprint: error.fingerprint,
          occurrenceCount: error.occurrenceCount,
          errorType: error.errorType,
          errorMessage: error.errorMessage,
          pagePath: error.pagePath,
          browser: error.browser,
          os: error.os,
          isResolved: error.isResolved,
          latestTimestamp: error.timestamp.toISO()!,
          ids: [error.id],
          errorMessageFullEncrypted: error.errorMessageFullEncrypted,
          stackTraceEncrypted: error.stackTraceEncrypted,
        })
      }
    }

    const result = Array.from(grouped.values()).sort(
      (a, b) => b.occurrenceCount - a.occurrenceCount
    )

    // Decrypt details for the top error entry
    if (result.length > 0) {
      const top = result[0]
      try {
        if (top.errorMessageFullEncrypted) {
          ;(top as any).errorMessageFull = analyticsEncryption.decrypt(
            top.errorMessageFullEncrypted
          )
        }
        if (top.stackTraceEncrypted) {
          ;(top as any).stackTrace = analyticsEncryption.decrypt(top.stackTraceEncrypted)
        }
      } catch {
        // Decryption failed — leave encrypted fields as-is
      }
    }

    // Remove encrypted fields from output
    const output = result.map(({ errorMessageFullEncrypted, stackTraceEncrypted, ...rest }) => ({
      ...rest,
      ...(rest === result[0]
        ? {
            errorMessageFull: (rest as any).errorMessageFull || null,
            stackTrace: (rest as any).stackTrace || null,
          }
        : {}),
    }))

    return response.ok({ errors: output })
  }

  async resolve({ params, response }: HttpContext) {
    const error = await AnalyticsError.find(params.id)
    if (!error) {
      return response.notFound({ message: 'Error not found' })
    }

    error.isResolved = !error.isResolved
    await error.save()

    return response.ok({
      error: {
        id: error.id,
        fingerprint: error.fingerprint,
        errorType: error.errorType,
        errorMessage: error.errorMessage,
        isResolved: error.isResolved,
      },
    })
  }

  private getStartDate(period: string): DateTime {
    const now = DateTime.now()
    switch (period) {
      case '30d':
        return now.minus({ days: 30 })
      case '90d':
        return now.minus({ days: 90 })
      case '7d':
      default:
        return now.minus({ days: 7 })
    }
  }
}
