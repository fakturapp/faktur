import type { HttpContext } from '@adonisjs/core/http'
import InvoiceSetting from '#models/team/invoice_setting'
import { lookupRecipient, buildPdpConfig } from '#services/einvoicing/pdp_service'
import {
  decryptModelFields,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'

export default class DirectoryLookup {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const siret = request.input('siret')
    if (!siret || typeof siret !== 'string' || siret.length < 9) {
      return response.badRequest({ message: 'SIRET invalide (9 a 14 caracteres attendus)' })
    }

    const invoiceSettings = await InvoiceSetting.query().where('team_id', teamId).first()
    if (!invoiceSettings?.eInvoicingEnabled) {
      return response.forbidden({ message: "La facturation electronique n'est pas activee" })
    }

    decryptModelFields(invoiceSettings, [...ENCRYPTED_FIELDS.invoiceSetting], dek)
    const pdpConfig = buildPdpConfig(invoiceSettings)

    const result = await lookupRecipient(pdpConfig, siret)

    return response.ok({
      siret,
      found: result.found,
      platform: result.platform,
      peppol: result.peppol,
      message: result.message,
    })
  }
}
