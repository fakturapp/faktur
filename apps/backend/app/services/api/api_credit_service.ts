import { DateTime } from 'luxon'
import ApiCreditUsage from '#models/api/api_credit_usage'

export const CREDIT_LIMITS = {
  PER_MINUTE: 3,
  PER_DAY: 100,
  PER_WEEK: 1000,
} as const

export type CreditCheckResult =
  | { ok: true; daily_remaining: number; weekly_remaining: number; minute_remaining: number }
  | { ok: false; reason: 'rate_limit_minute' | 'quota_daily' | 'quota_weekly'; retry_after_seconds: number }

function isoWeekStart(now: DateTime): DateTime {
  return now.toUTC().startOf('week')
}

function isoDay(now: DateTime): DateTime {
  return now.toUTC().startOf('day')
}

class ApiCreditService {
  async getOrCreateRow(teamId: string, userId: string | null, now: DateTime): Promise<ApiCreditUsage> {
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
    })
    return row
  }

  async recomputeWeeklyTotal(teamId: string, weekStart: DateTime): Promise<number> {
    const result = await ApiCreditUsage.query()
      .where('teamId', teamId)
      .where('weekStart', weekStart.toSQLDate()!)
      .sum('daily_count as total')
      .first()
    const raw = (result as unknown as { $extras?: { total?: string | number } } | null)?.$extras?.total
    return raw ? Number(raw) : 0
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

    if (row.dailyCount >= CREDIT_LIMITS.PER_DAY) {
      const tomorrow = isoDay(now).plus({ days: 1 })
      return {
        ok: false,
        reason: 'quota_daily',
        retry_after_seconds: Math.max(1, Math.floor(tomorrow.diff(now, 'seconds').seconds)),
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
      daily_remaining: Math.max(0, CREDIT_LIMITS.PER_DAY - row.dailyCount),
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
    row.dailyCount += amount
    row.weeklyCount += amount
    if (userId && !row.userId) row.userId = userId
    await row.save()
  }

  async getUsage(teamId: string): Promise<{
    daily: { used: number; limit: number; remaining: number; reset_at: string }
    weekly: { used: number; limit: number; remaining: number; reset_at: string }
    per_minute: { limit: number }
  }> {
    const now = DateTime.utc()
    const day = isoDay(now)
    const weekStart = isoWeekStart(now)

    const todayRow = await ApiCreditUsage.query()
      .where('teamId', teamId)
      .where('day', day.toSQLDate()!)
      .first()
    const weekly = await this.recomputeWeeklyTotal(teamId, weekStart)

    const dailyUsed = todayRow?.dailyCount ?? 0

    return {
      daily: {
        used: dailyUsed,
        limit: CREDIT_LIMITS.PER_DAY,
        remaining: Math.max(0, CREDIT_LIMITS.PER_DAY - dailyUsed),
        reset_at: day.plus({ days: 1 }).toISO()!,
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
