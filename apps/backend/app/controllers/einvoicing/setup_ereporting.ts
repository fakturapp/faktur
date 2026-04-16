import type { HttpContext } from '@adonisjs/core/http'
import InvoiceSetting from '#models/team/invoice_setting'
import { buildPdpConfig } from '#services/einvoicing/pdp_service'
import * as b2b from '#services/einvoicing/b2brouter_client'
import {
  decryptModelFields,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'

export default class SetupEReporting {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
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
        message: 'E-reporting configure en mode sandbox',
        sandbox: true,
      })
    }

    if (!pdpConfig.b2bAccountId) {
      return response.badRequest({ message: 'Compte B2Brouter non configure' })
    }

    const typeOperation = request.input('type_operation')
    const nafCode = request.input('naf_code')
    const enterpriseSize = request.input('enterprise_size')
    const startDate = request.input('start_date', '2026-09-01')

    if (!typeOperation || !['services', 'goods', 'mixed'].includes(typeOperation)) {
      return response.badRequest({ message: 'type_operation requis (services, goods, mixed)' })
    }
    if (!nafCode || typeof nafCode !== 'string') {
      return response.badRequest({ message: 'naf_code requis (code NAF/APE a 2 chiffres)' })
    }
    if (!enterpriseSize || !['micro', 'pme', 'eti', 'ge'].includes(enterpriseSize)) {
      return response.badRequest({ message: 'enterprise_size requis (micro, pme, eti, ge)' })
    }

    const b2bConfig = {
      apiKey: pdpConfig.apiKey || '',
      sandbox: pdpConfig.sandbox,
      accountId: pdpConfig.b2bAccountId,
    }

    const result = await b2b.createTaxReportSetting(b2bConfig, pdpConfig.b2bAccountId, {
      code: 'dgfip',
      start_date: startDate,
      type_operation: typeOperation,
      naf_code: nafCode,
      enterprise_size: enterpriseSize,
      email: request.input('email'),
      auto_send: request.input('auto_send', true),
    })

    if (!result.ok) {
      return response.badRequest({
        message: 'Erreur configuration e-reporting',
        error: result.error,
      })
    }

    invoiceSettings.b2bEreportingEnabled = true
    invoiceSettings.b2bEnterpriseSize = enterpriseSize
    invoiceSettings.b2bNafCode = nafCode
    invoiceSettings.b2bTypeOperation = typeOperation
    await invoiceSettings.save()

    return response.ok({
      message: 'E-reporting DGFiP configure avec succes',
      setting: result.setting,
    })
  }
}

export class GetEReportingStatus {
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
