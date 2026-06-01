import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import vine from '@vinejs/vine'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import billingService from '#services/billing/billing_service'

const scheduleValidator = vine.compile(
  vine.object({
    plan: vine.enum(['pro', 'team'] as const).optional(),
    period: vine.enum(['monthly', 'annual'] as const).optional(),
    cancel: vine.boolean().optional(),
  })
)

const RANK: Record<string, number> = { free: 0, pro: 1, team: 2 }

export default class ScheduleChange {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!

    if (!billingService.isConfigured()) {
      return response.serviceUnavailable({ message: "Le paiement n'est pas encore configuré." })
    }
    if (!user.currentTeamId) {
      return response.badRequest({ message: 'Aucune équipe sélectionnée' })
    }

    const member = await TeamMember.query()
      .where('teamId', user.currentTeamId)
      .where('userId', user.id)
      .where('status', 'active')
      .first()
    if (!member || member.role !== 'super_admin') {
      return response.forbidden({ message: "Seul le propriétaire peut gérer l'abonnement." })
    }

    const team = await Team.findOrFail(user.currentTeamId)
    if (!team.stripeSubscriptionId) {
      return response.badRequest({ message: 'Aucun abonnement actif.' })
    }

    const payload = await request.validateUsing(scheduleValidator)

    if (payload.cancel === true) {
      try {
        await billingService.releaseScheduledChange(team.stripeSubscriptionId)
      } catch (err: any) {
        return response.badRequest({ message: err?.message || 'Impossible d’annuler le changement' })
      }
      team.pendingPlan = null
      team.pendingPlanPeriod = null
      await team.save()
      return response.ok({ message: 'Changement de forfait annulé' })
    }

    if (!payload.plan || !payload.period) {
      return response.badRequest({ message: 'Forfait cible manquant' })
    }
    if (team.plan !== 'pro' && team.plan !== 'team') {
      return response.badRequest({ message: 'Aucun forfait payant en cours.' })
    }
    if (RANK[payload.plan] >= RANK[team.plan]) {
      return response.badRequest({
        message: "Ce changement n'est pas une rétrogradation.",
      })
    }

    try {
      const result = await billingService.scheduleChangeAtPeriodEnd({
        subscriptionId: team.stripeSubscriptionId,
        currentPlan: team.plan,
        currentPeriod: team.planPeriod ?? 'monthly',
        targetPlan: payload.plan,
        targetPeriod: payload.period,
        teamId: team.id,
      })

      team.pendingPlan = payload.plan
      team.pendingPlanPeriod = payload.period
      if (result.effectiveAt) {
        team.subscriptionCurrentPeriodEnd = DateTime.fromSeconds(result.effectiveAt)
      }
      await team.save()

      return response.ok({
        message: 'Changement programmé',
        pendingPlan: payload.plan,
        effectiveAt: result.effectiveAt,
      })
    } catch (err: any) {
      return response.badRequest({
        message: err?.message || 'Impossible de programmer le changement de forfait',
      })
    }
  }
}
