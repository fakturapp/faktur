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
        .count('* as cnt')
        .first(),
      Invoice.query()
        .where('teamId', user.currentTeamId)
        .where('status', 'draft')
        .count('* as cnt')
        .first(),
    ])

    const quoteDrafts = Number(quoteResult?.$extras.cnt ?? 0)
    const invoiceDrafts = Number(invoiceResult?.$extras.cnt ?? 0)

    return response.ok({ quoteDrafts, invoiceDrafts })
  }
}
