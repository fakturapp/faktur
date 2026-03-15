import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import Team from '#models/team/team'
import TeamMember from '#models/team/team_member'
import Company from '#models/team/company'
import InvoiceSetting from '#models/team/invoice_setting'
import Client from '#models/client/client'
import Invoice from '#models/invoice/invoice'
import InvoiceLine from '#models/invoice/invoice_line'
import Quote from '#models/quote/quote'
import QuoteLine from '#models/quote/quote_line'

const deleteTeamValidator = vine.compile(
  vine.object({
    teamName: vine.string(),
    password: vine.string(),
  })
)

export default class Delete {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const payload = await request.validateUsing(deleteTeamValidator)

    // Verify user is super_admin (owner)
    const membership = await TeamMember.query()
      .where('teamId', teamId)
      .where('userId', user.id)
      .where('status', 'active')
      .first()

    if (!membership || membership.role !== 'super_admin') {
      return response.forbidden({ message: 'Seul le propriétaire peut supprimer l\'équipe' })
    }

    // Verify team name matches
    const team = await Team.find(teamId)
    if (!team) {
      return response.notFound({ message: 'Team not found' })
    }

    if (team.name !== payload.teamName) {
      return response.unprocessableEntity({ message: 'Le nom de l\'équipe ne correspond pas' })
    }

    // Verify password
    const isValid = await hash.verify(user.password, payload.password)
    if (!isValid) {
      return response.unauthorized({ message: 'Mot de passe incorrect' })
    }

    // Cascade delete in transaction
    await db.transaction(async (trx) => {
      // Delete invoice lines (via invoices)
      const invoiceIds = await Invoice.query({ client: trx })
        .where('teamId', teamId)
        .select('id')
      if (invoiceIds.length > 0) {
        await InvoiceLine.query({ client: trx })
          .whereIn('invoiceId', invoiceIds.map((i) => i.id))
          .delete()
      }

      // Delete quote lines (via quotes)
      const quoteIds = await Quote.query({ client: trx })
        .where('teamId', teamId)
        .select('id')
      if (quoteIds.length > 0) {
        await QuoteLine.query({ client: trx })
          .whereIn('quoteId', quoteIds.map((q) => q.id))
          .delete()
      }

      // Delete invoices
      await Invoice.query({ client: trx }).where('teamId', teamId).delete()

      // Delete quotes
      await Quote.query({ client: trx }).where('teamId', teamId).delete()

      // Delete clients
      await Client.query({ client: trx }).where('teamId', teamId).delete()

      // Delete invoice settings
      await InvoiceSetting.query({ client: trx }).where('teamId', teamId).delete()

      // Delete company
      await Company.query({ client: trx }).where('teamId', teamId).delete()

      // Delete team members
      await TeamMember.query({ client: trx }).where('teamId', teamId).delete()

      // Delete team
      await team.useTransaction(trx).delete()
    })

    // Find another team for the user, if any
    const otherMembership = await TeamMember.query()
      .where('userId', user.id)
      .where('status', 'active')
      .preload('team')
      .first()

    if (otherMembership) {
      user.currentTeamId = otherMembership.teamId
    } else {
      user.currentTeamId = null
      user.onboardingCompleted = false
    }
    await user.save()

    return response.ok({
      message: 'Équipe supprimée',
      switchedToTeamId: user.currentTeamId,
    })
  }
}
