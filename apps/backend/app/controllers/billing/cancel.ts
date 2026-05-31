import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import billingService from '#services/billing/billing_service'

const cancelValidator = vine.compile(
  vine.object({
    resume: vine.boolean().optional(),
  })
)

export default class Cancel {
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

    const payload = await request.validateUsing(cancelValidator)
    const resume = payload.resume === true

    try {
      await billingService.setCancelAtPeriodEnd(team.stripeSubscriptionId, !resume)
      team.subscriptionCancelAtPeriodEnd = !resume
      team.subscriptionCancelExternal = false
      await team.save()
      return response.ok({
        message: resume ? 'Abonnement réactivé' : 'Abonnement programmé pour annulation',
        cancelAtPeriodEnd: !resume,
      })
    } catch (err: any) {
      return response.badRequest({ message: err?.message || "Impossible de mettre à jour l'abonnement" })
    }
  }
}
