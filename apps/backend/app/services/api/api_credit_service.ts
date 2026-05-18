import { DateTime } from 'luxon'
import ApiCreditUsage from '#models/api/api_credit_usage'

export const CREDIT_LIMITS = {
  PER_MINUTE: 3,
  SESSION_HOURS: 5,
  PER_SESSION: 100,
  PER_WEEK: 1000,
} as const

export type CreditCheckResult =
  | {
      ok: true
      session_remaining: number
      weekly_remaining: number
      minute_remaining: number
    }
  | {
      ok: false
      reason: 'rate_limit_minute' | 'quota_session' | 'quota_weekly'
      retry_after_seconds: number
    }

function isoWeekStart(now: DateTime): DateTime {
  return now.toUTC().startOf('week')
}

function isoDay(now: DateTime): DateTime {
  return now.toUTC().startOf('day')
}

function sessionExpired(startedAt: DateTime | null, now: DateTime): boolean {
  if (!startedAt) return true
  return now.diff(startedAt, 'hours').hours >= CREDIT_LIMITS.SESSION_HOURS
}

class ApiCreditService {
  async getOrCreateRow(
    teamId: string,
    userId: string | null,
    now: DateTime
  ): Promise<ApiCreditUsage> {
    const day = isoDay(now)
    const weekStart = isoWeekStart(now)

    const existing = await ApiCreditUsage.query()
      .where('teamId', teamId)
      .where('day', day.toSQLDate()!)
      .first()

    if (existing) {
      if (
        !existing.weekStart ||
        existing.weekStart.toUTC().toMillis() !== weekStart.toMillis()
      ) {
        existing.weekStart = weekStart
        existing.weeklyCount = await this.recomputeWeeklyTotal(teamId, weekStart)
        await existing.save()
      }
      return existing
    }

    const weeklyCount = await this.recomputeWeeklyTotal(teamId, weekStart)
    const row = await ApiCreditUsage.create({
      teamId,
      userId,
      day,
      weekStart,
      dailyCount: 0,
      weeklyCount,
      lastMinuteAt: null,
      minuteCount: 0,
      sessionStartedAt: null,
      sessionCount: 0,
    })
    return row
  }

  async recomputeWeeklyTotal(teamId: string, weekStart: DateTime): Promise<number> {
    const result = await ApiCreditUsage.query()
      .where('teamId', teamId)
      .where('weekStart', weekStart.toSQLDate()!)
      .sum('daily_count as total')
      .first()
    const raw = (result as unknown as { $extras?: { total?: string | number } } | null)?.$extras
      ?.total
    return raw ? Number(raw) : 0
  }

  async findActiveSession(
    teamId: string,
    now: DateTime
  ): Promise<{ startedAt: DateTime; count: number; row: ApiCreditUsage } | null> {
    const cutoff = now.minus({ hours: CREDIT_LIMITS.SESSION_HOURS })
    const recent = await ApiCreditUsage.query()
      .where('teamId', teamId)
      .whereNotNull('sessionStartedAt')
      .where('sessionStartedAt', '>=', cutoff.toSQL()!)
      .orderBy('sessionStartedAt', 'desc')
      .first()

    if (!recent || !recent.sessionStartedAt) return null
    if (sessionExpired(recent.sessionStartedAt, now)) return null

    return { startedAt: recent.sessionStartedAt, count: recent.sessionCount, row: recent }
  }

  async check(teamId: string, userId: string | null): Promise<CreditCheckResult> {
    const now = DateTime.utc()
    const row = await this.getOrCreateRow(teamId, userId, now)

    if (row.lastMinuteAt && now.diff(row.lastMinuteAt, 'seconds').seconds < 60) {
      if (row.minuteCount >= CREDIT_LIMITS.PER_MINUTE) {
        const retry = Math.max(1, 60 - Math.floor(now.diff(row.lastMinuteAt, 'seconds').seconds))
        return { ok: false, reason: 'rate_limit_minute', retry_after_seconds: retry }
      }
    }

    const session = await this.findActiveSession(teamId, now)
    const sessionCount = session?.count ?? 0
    if (sessionCount >= CREDIT_LIMITS.PER_SESSION) {
      const expiresAt = session!.startedAt.plus({ hours: CREDIT_LIMITS.SESSION_HOURS })
      return {
        ok: false,
        reason: 'quota_session',
        retry_after_seconds: Math.max(1, Math.floor(expiresAt.diff(now, 'seconds').seconds)),
      }
    }

    if (row.weeklyCount >= CREDIT_LIMITS.PER_WEEK) {
      const nextWeek = isoWeekStart(now).plus({ weeks: 1 })
      return {
        ok: false,
        reason: 'quota_weekly',
        retry_after_seconds: Math.max(1, Math.floor(nextWeek.diff(now, 'seconds').seconds)),
      }
    }

    return {
      ok: true,
      session_remaining: Math.max(0, CREDIT_LIMITS.PER_SESSION - sessionCount),
      weekly_remaining: Math.max(0, CREDIT_LIMITS.PER_WEEK - row.weeklyCount),
      minute_remaining: Math.max(
        0,
        CREDIT_LIMITS.PER_MINUTE -
          (row.lastMinuteAt && now.diff(row.lastMinuteAt, 'seconds').seconds < 60
            ? row.minuteCount
            : 0)
      ),
    }
  }

  async charge(teamId: string, userId: string | null, amount = 1): Promise<void> {
    const now = DateTime.utc()
    const row = await this.getOrCreateRow(teamId, userId, now)

    const withinMinute =
      row.lastMinuteAt && now.diff(row.lastMinuteAt, 'seconds').seconds < 60

    row.minuteCount = withinMinute ? row.minuteCount + amount : amount
    row.lastMinuteAt = now

    const activeSession = await this.findActiveSession(teamId, now)
    if (activeSession && activeSession.row.id === row.id) {
      row.sessionCount += amount
    } else if (activeSession) {
      activeSession.row.sessionCount += amount
      await activeSession.row.save()
    } else {
      row.sessionStartedAt = now
      row.sessionCount = amount
    }

    row.dailyCount += amount
    row.weeklyCount += amount
    if (userId && !row.userId) row.userId = userId
    await row.save()
  }

  async getUsage(teamId: string): Promise<{
    session: {
      used: number
      limit: number
      remaining: number
      started_at: string | null
      reset_at: string | null
      hours_window: number
      active: boolean
    }
    weekly: { used: number; limit: number; remaining: number; reset_at: string }
    per_minute: { limit: number }
  }> {
    const now = DateTime.utc()
    const weekStart = isoWeekStart(now)

    const session = await this.findActiveSession(teamId, now)
    const sessionUsed = session?.count ?? 0
    const sessionStartedAt = session?.startedAt ?? null
    const sessionResetAt = sessionStartedAt
      ? sessionStartedAt.plus({ hours: CREDIT_LIMITS.SESSION_HOURS })
      : null

    const weekly = await this.recomputeWeeklyTotal(teamId, weekStart)

    return {
      session: {
        used: sessionUsed,
        limit: CREDIT_LIMITS.PER_SESSION,
        remaining: Math.max(0, CREDIT_LIMITS.PER_SESSION - sessionUsed),
        started_at: sessionStartedAt ? sessionStartedAt.toISO() : null,
        reset_at: sessionResetAt ? sessionResetAt.toISO() : null,
        hours_window: CREDIT_LIMITS.SESSION_HOURS,
        active: Boolean(sessionStartedAt),
      },
      weekly: {
        used: weekly,
        limit: CREDIT_LIMITS.PER_WEEK,
        remaining: Math.max(0, CREDIT_LIMITS.PER_WEEK - weekly),
        reset_at: weekStart.plus({ weeks: 1 }).toISO()!,
      },
      per_minute: { limit: CREDIT_LIMITS.PER_MINUTE },
    }
  }
}

export default new ApiCreditService()
