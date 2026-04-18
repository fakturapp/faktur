import type { HttpContext } from '@adonisjs/core/http'
import Company from '#models/team/company'
import InvoiceSetting from '#models/team/invoice_setting'
import { buildDefaultInvoiceSettings } from '#services/settings/default_invoice_settings'
import { serializeInvoiceSettings } from '#services/settings/serialize_invoice_settings'

export default class InvoiceSettingsShow {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const company = await Company.findBy('teamId', user.currentTeamId)
    const companyLogoUrl = company?.logoUrl || null
    const settings = await InvoiceSetting.findBy('teamId', user.currentTeamId)

    return response.ok({
      companyLogoUrl,
      settings: serializeInvoiceSettings(
        settings || buildDefaultInvoiceSettings(user.currentTeamId)
      ),
    })
  }
}
