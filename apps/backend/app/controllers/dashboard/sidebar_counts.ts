import type { HttpContext } from '@adonisjs/core/http'
import Quote from '#models/quote/quote'
import Invoice from '#models/invoice/invoice'

export default class SidebarCounts {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.ok({ quoteDrafts: 0, invoiceDrafts: 0 })
    }

    const [quoteResult, invoiceResult] = await Promise.all([
      Quote.query()
        .where('teamId', user.currentTeamId)
        .where('status', 'draft')
        .count('* as total')
        .first(),
      Invoice.query()
        .where('teamId', user.currentTeamId)
        .where('status', 'draft')
        .count('* as total')
        .first(),
    ])

    const quoteDrafts = Number(quoteResult?.$extras.total ?? 0)
    const invoiceDrafts = Number(invoiceResult?.$extras.total ?? 0)

    return response.ok({ quoteDrafts, invoiceDrafts })
  }
}
