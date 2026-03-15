import type { HttpContext } from '@adonisjs/core/http'
import Invoice from '#models/invoice/invoice'
import InvoiceSetting from '#models/team/invoice_setting'

export default class NextNumber {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    // Check if there's a custom starting number set
    const settings = await InvoiceSetting.query().where('team_id', teamId).first()
    if (settings?.nextInvoiceNumber) {
      return response.ok({ nextNumber: settings.nextInvoiceNumber })
    }

    const lastInvoice = await Invoice.query()
      .where('team_id', teamId)
      .orderBy('created_at', 'desc')
      .first()

    let nextNumber = 'FAC-001'

    if (lastInvoice) {
      const match = lastInvoice.invoiceNumber.match(/^FAC-(\d+)$/)
      if (match) {
        const num = parseInt(match[1], 10) + 1
        nextNumber = `FAC-${num.toString().padStart(3, '0')}`
      }
    }

    return response.ok({ nextNumber })
  }
}
