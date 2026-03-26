import type { HttpContext } from '@adonisjs/core/http'
import Quote from '#models/quote/quote'
import InvoiceSetting from '#models/team/invoice_setting'

export default class SetNextNumber {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    // Only allow setting next number if no quotes exist yet
    const result = await Quote.query().where('team_id', teamId).count('* as cnt').first()

    const count = Number(result?.$extras.cnt ?? 0)
    if (count > 0) {
      return response.badRequest({ message: 'Cannot set starting number after documents exist' })
    }

    const { nextNumber } = request.only(['nextNumber'])
    if (!nextNumber || typeof nextNumber !== 'string') {
      return response.badRequest({ message: 'nextNumber is required' })
    }

    const settings = await InvoiceSetting.query().where('team_id', teamId).first()
    if (!settings) {
      return response.notFound({ message: 'Invoice settings not found' })
    }

    settings.nextQuoteNumber = nextNumber
    await settings.save()

    return response.ok({ message: 'Next number set', nextNumber })
  }
}
