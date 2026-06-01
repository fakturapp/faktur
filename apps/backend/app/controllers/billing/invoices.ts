import type { HttpContext } from '@adonisjs/core/http'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import billingService from '#services/billing/billing_service'

export default class Invoices {
  async handle({ auth, response }: HttpContext) {
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
      return response.forbidden({ message: "Seul le propriétaire peut consulter les factures." })
    }

    const team = await Team.findOrFail(user.currentTeamId)
    if (!team.stripeCustomerId) {
      return response.ok({ invoices: [] })
    }

    let raw: any[]
    try {
      raw = await billingService.listInvoices(team.stripeCustomerId)
    } catch (err: any) {
      return response.badRequest({ message: err?.message || 'Erreur Stripe' })
    }

    const invoices = raw
      .filter((inv) => inv.status !== 'draft')
      .map((inv) => ({
        id: inv.id,
        number: inv.number ?? null,
        created: inv.created ? inv.created * 1000 : null,
        dueDate: inv.due_date ? inv.due_date * 1000 : null,
        total: typeof inv.total === 'number' ? inv.total : null,
        currency: inv.currency ?? 'eur',
        status: inv.status ?? null,
        amountRemaining: typeof inv.amount_remaining === 'number' ? inv.amount_remaining : null,
        hostedUrl: inv.hosted_invoice_url ?? null,
        pdfUrl: inv.invoice_pdf ?? null,
      }))

    return response.ok({ invoices })
  }
}
