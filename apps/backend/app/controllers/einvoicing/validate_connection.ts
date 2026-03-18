import type { HttpContext } from '@adonisjs/core/http'
import InvoiceSetting from '#models/team/invoice_setting'
import { validatePdpConnection, buildPdpConfig } from '#services/einvoicing/pdp_service'
import { decryptModelFields, ENCRYPTED_FIELDS } from '#services/crypto/field_encryption_helper'

export default class ValidateConnection {
  async handle(ctx: HttpContext) {
    const { auth, response } = ctx
    const user = auth.user!
    const teamId = user.currentTeamId
    const dek: Buffer = (ctx as any).dek

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const invoiceSettings = await InvoiceSetting.query().where('team_id', teamId).first()
    if (!invoiceSettings?.eInvoicingEnabled) {
      return response.forbidden({ message: 'La facturation electronique n\'est pas activee' })
    }

    // Decrypt pdpApiKey before building config
    decryptModelFields(invoiceSettings, [...ENCRYPTED_FIELDS.invoiceSetting], dek)

    const pdpConfig = buildPdpConfig(invoiceSettings)
    const result = await validatePdpConnection(pdpConfig)

    return response.ok({
      connected: result.connected,
      message: result.message,
      provider: pdpConfig.provider,
      sandbox: pdpConfig.sandbox,
    })
  }
}
