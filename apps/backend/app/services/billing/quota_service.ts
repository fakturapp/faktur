import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Subscription from '#models/billing/subscription'
import AiUsageLog from '#models/billing/ai_usage_log'

interface PlanLimits {
  hourly: number
  weekly: number
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: { hourly: 5, weekly: 20 },
  ai_pro: { hourly: 30, weekly: 100 },
}

interface PlanInfo {
  name: string
  status: string
  expiresAt: string | null
}

interface UsageData {
  planName: 'free' | 'ai_pro'
  quota: {
    usageHourly: number
    limitHourly: number
    percentHourly: number
    resetAtHourly: string
    usageWeek: number
    limitWeek: number
    percentWeek: number
    resetAtWeek: string
    percentDisplay: number
  }
  history: Array<{ date: string; count: number }>
  byType: Array<{ type: string; count: number; label: string }>
}

const ACTION_LABELS: Record<string, string> = {
  generate_text: 'Generation de texte',
  suggest_lines: 'Suggestions de lignes',
  dashboard_summary: 'Resume tableau de bord',
  generate_reminder: 'Relance de paiement',
  generate_document: 'Generation de document',
  chat_document: 'Chat document',
}

class QuotaService {
  async getUserPlan(userId: string): Promise<PlanInfo> {
    const sub = await Subscription.findBy('userId', userId)

    if (!sub || sub.planName === 'free') {
      return { name: 'free', status: 'active', expiresAt: null }
    }

    // Grace period: if canceled but period not yet ended
    if (sub.cancelAtPeriodEnd && sub.currentPeriodEnd) {
      const now = DateTime.now()
      if (sub.currentPeriodEnd > now) {
        return {
          name: sub.planName,
          status: 'canceled',
          expiresAt: sub.currentPeriodEnd.toISO(),
        }
      }
      // Period ended — downgrade to free
      return { name: 'free', status: 'active', expiresAt: null }
    }

    return {
      name: sub.planName,
      status: sub.status,
      expiresAt: sub.currentPeriodEnd?.toISO() || null,
    }
  }

  async canMakeRequest(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const plan = await this.getUserPlan(userId)
    const effectivePlan = plan.name === 'free' ? 'free' : 'ai_pro'
    const limits = PLAN_LIMITS[effectivePlan] || PLAN_LIMITS.free

    const now = DateTime.now()
    const oneHourAgo = now.minus({ hours: 1 }).toISO()!
    const oneWeekAgo = now.minus({ weeks: 1 }).toISO()!

    const [hourlyResult, weeklyResult] = await Promise.all([
      db.from('ai_usage_logs').where('user_id', userId).where('created_at', '>=', oneHourAgo).count('* as cnt'),
      db.from('ai_usage_logs').where('user_id', userId).where('created_at', '>=', oneWeekAgo).count('* as cnt'),
    ])

    const hourlyCount = Number(hourlyResult[0].cnt) || 0
    const weeklyCount = Number(weeklyResult[0].cnt) || 0

    if (hourlyCount >= limits.hourly) {
      return { allowed: false, reason: `Limite horaire atteinte (${limits.hourly} req/h). Reessayez plus tard.` }
    }
    if (weeklyCount >= limits.weekly) {
      return { allowed: false, reason: `Limite hebdomadaire atteinte (${limits.weekly} req/sem). Reessayez la semaine prochaine.` }
    }

    return { allowed: true }
  }

  async recordUsage(
    userId: string,
    teamId: string,
    action: string,
    provider: string,
    model: string,
    tokens?: number
  ): Promise<void> {
    await AiUsageLog.create({
      userId,
      teamId,
      action,
      provider,
      model,
      tokensUsed: tokens ?? null,
    })
  }

  async getUsageStats(userId: string): Promise<UsageData> {
    const plan = await this.getUserPlan(userId)
    const effectivePlan = plan.name === 'free' ? 'free' : 'ai_pro'
    const limits = PLAN_LIMITS[effectivePlan] || PLAN_LIMITS.free

    const now = DateTime.now()
    const oneHourAgo = now.minus({ hours: 1 }).toISO()!
    const oneWeekAgo = now.minus({ weeks: 1 }).toISO()!
    const thirtyDaysAgo = now.minus({ days: 30 }).toISO()!

    const [hourlyResult, weeklyResult, historyResult, byTypeResult] = await Promise.all([
      db.from('ai_usage_logs').where('user_id', userId).where('created_at', '>=', oneHourAgo).count('* as cnt'),
      db.from('ai_usage_logs').where('user_id', userId).where('created_at', '>=', oneWeekAgo).count('* as cnt'),
      db.rawQuery(
        `SELECT DATE(created_at) as date, COUNT(*)::int as count
         FROM ai_usage_logs
         WHERE user_id = ? AND created_at >= ?
         GROUP BY DATE(created_at)
         ORDER BY date`,
        [userId, thirtyDaysAgo]
      ),
      db.rawQuery(
        `SELECT action as type, COUNT(*)::int as count
         FROM ai_usage_logs
         WHERE user_id = ? AND created_at >= ?
         GROUP BY action
         ORDER BY count DESC`,
        [userId, thirtyDaysAgo]
      ),
    ])

    const usageHourly = Number(hourlyResult[0].cnt) || 0
    const usageWeek = Number(weeklyResult[0].cnt) || 0

    const percentHourly = limits.hourly > 0 ? Math.round((usageHourly / limits.hourly) * 100) : 0
    const percentWeek = limits.weekly > 0 ? Math.round((usageWeek / limits.weekly) * 100) : 0

    const resetAtHourly = now.plus({ hours: 1 }).toISO()!
    const resetAtWeek = now.plus({ weeks: 1 }).toISO()!

    const history = (historyResult.rows || []).map((r: any) => ({
      date: r.date,
      count: r.count,
    }))

    const byType = (byTypeResult.rows || []).map((r: any) => ({
      type: r.type,
      count: r.count,
      label: ACTION_LABELS[r.type] || r.type,
    }))

    return {
      planName: effectivePlan as 'free' | 'ai_pro',
      quota: {
        usageHourly,
        limitHourly: limits.hourly,
        percentHourly,
        resetAtHourly,
        usageWeek,
        limitWeek: limits.weekly,
        percentWeek,
        resetAtWeek,
        percentDisplay: Math.max(percentHourly, percentWeek),
      },
      history,
      byType,
    }
  }
}

export default new QuotaService()
