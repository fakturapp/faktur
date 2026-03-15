import type { HttpContext } from '@adonisjs/core/http'
import Invoice from '#models/invoice/invoice'

export default class UpdateComment {
  async handle({ auth, params, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const invoice = await Invoice.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .first()

    if (!invoice) {
      return response.notFound({ message: 'Invoice not found' })
    }

    const { comment } = request.only(['comment'])
    invoice.comment = comment || null
    await invoice.save()

    return response.ok({ message: 'Comment updated' })
  }
}
