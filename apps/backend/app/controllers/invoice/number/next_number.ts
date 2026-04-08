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

    const settings = await InvoiceSetting.query().where('team_id', teamId).first()
    if (settings?.nextInvoiceNumber) {
      return response.ok({ nextNumber: settings.nextInvoiceNumber })
    }

    const pattern = settings?.invoiceFilenamePattern || 'FAK-{annee}-{numero}'
    const currentYear = new Date().getFullYear().toString()
    const prefix = pattern.replace('{annee}', currentYear).replace('{numero}', '')

    const lastInvoice = await Invoice.query()
      .where('team_id', teamId)
      .where('invoice_number', 'like', `${prefix}%`)
      .orderBy('created_at', 'desc')
      .first()

    let nextNum = 1
    if (lastInvoice) {
      const numStr = lastInvoice.invoiceNumber.slice(prefix.length)
      const parsed = Number.parseInt(numStr, 10)
      if (!Number.isNaN(parsed)) nextNum = parsed + 1
    }

    const nextNumber = `${prefix}${nextNum.toString().padStart(3, '0')}`

    return response.ok({ nextNumber })
  }
}
