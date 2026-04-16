import type { HttpContext } from '@adonisjs/core/http'
import InvoiceSetting from '#models/team/invoice_setting'
import { buildPdpConfig } from '#services/einvoicing/pdp_service'
import * as b2b from '#services/einvoicing/b2brouter_client'
import {
  decryptModelFields,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'

export default class GetEReportingStatus {
  async handle(ctx: HttpContext) {
    const { auth, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const invoiceSettings = await InvoiceSetting.query().where('team_id', teamId).first()
    if (!invoiceSettings?.eInvoicingEnabled) {
      return response.forbidden({ message: "La facturation electronique n'est pas activee" })
    }

    decryptModelFields(invoiceSettings, [...ENCRYPTED_FIELDS.invoiceSetting], dek)
    const pdpConfig = buildPdpConfig(invoiceSettings)

    if (pdpConfig.sandbox && !pdpConfig.apiKey) {
      return response.ok({
        enabled: invoiceSettings.b2bEreportingEnabled,
        sandbox: true,
        message: 'Mode sandbox',
      })
    }

    if (!pdpConfig.b2bAccountId) {
      return response.ok({
        enabled: false,
        message: 'Compte B2Brouter non configure',
      })
    }

    const b2bConfig = {
      apiKey: pdpConfig.apiKey || '',
      sandbox: pdpConfig.sandbox,
      accountId: pdpConfig.b2bAccountId,
    }

    const result = await b2b.getTaxReportSetting(b2bConfig, pdpConfig.b2bAccountId, 'dgfip')

    return response.ok({
      enabled: result.ok && result.setting?.enabled,
      setting: result.setting,
      localConfig: {
        enterpriseSize: invoiceSettings.b2bEnterpriseSize,
        nafCode: invoiceSettings.b2bNafCode,
        typeOperation: invoiceSettings.b2bTypeOperation,
      },
    })
  }
}
