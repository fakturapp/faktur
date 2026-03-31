import type { HttpContext } from '@adonisjs/core/http'
import { addDomainValidator } from '#validators/email_blocklist_validator'
import EmailBlocklist from '#models/security/email_blocklist'
import EmailBlocklistService from '#services/security/email_blocklist_service'

export default class EmailBlocklistAdmin {
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const search = request.input('search', '')

    const query = EmailBlocklist.query().orderBy('createdAt', 'desc')

    if (search) {
      query.where('domain', 'ilike', `%${search}%`)
    }

    const entries = await query.paginate(page, 20)
    const totalBlocked = await EmailBlocklistService.getBlockedCount()

    return response.ok({
      entries: entries.serialize(),
      totalBlocked,
    })
  }

  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(addDomainValidator)

    await EmailBlocklistService.addDomain(data.domain, data.reason)

    return response.created({
      message: `Le domaine ${data.domain} a été ajouté à la blocklist.`,
    })
  }

  async destroy({ params, response }: HttpContext) {
    const domain = params.domain
    if (!domain) {
      return response.badRequest({ message: 'Domaine requis.' })
    }

    await EmailBlocklistService.removeDomain(domain)

    return response.ok({
      message: `Le domaine ${domain} a été supprimé de la blocklist.`,
    })
  }
}
