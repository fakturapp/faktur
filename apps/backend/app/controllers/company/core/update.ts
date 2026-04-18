import type { HttpContext } from '@adonisjs/core/http'
import Company from '#models/team/company'
import InvoiceSetting from '#models/team/invoice_setting'
import { updateCompanyValidator } from '#validators/auth/onboarding_validators'
import {
  encryptModelFields,
  decryptModelFields,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'

function buildDefaultInvoiceSettings(teamId: string) {
  return {
    teamId,
    billingType: 'quick' as const,
    accentColor: '#6366f1',
    logoUrl: null,
    logoSource: 'custom' as const,
    paymentMethods: ['bank_transfer'],
    customPaymentMethod: null,
    template: 'classique',
    darkMode: false,
    documentFont: 'Lexend',
    eInvoicingEnabled: false,
    pdpProvider: null,
    pdpApiKey: null,
    pdpSandbox: true,
    defaultOperationCategory: 'service' as const,
    defaultSubject: null,
    defaultAcceptanceConditions: null,
    defaultSignatureField: false,
    defaultFreeField: null,
    defaultShowNotes: true,
    defaultVatExempt: false,
    defaultVatRate: 20,
    defaultShowQuantityColumn: true,
    defaultShowUnitColumn: true,
    defaultShowUnitPriceColumn: true,
    defaultShowVatColumn: true,
    defaultFooterText: null,
    defaultShowDeliveryAddress: false,
    defaultLanguage: 'fr',
    quoteFilenamePattern: 'DEV-{numero}',
    invoiceFilenamePattern: 'FAC-{numero}',
    footerMode: 'company_info' as const,
    logoBorderRadius: 0,
    nextInvoiceNumber: null,
    nextQuoteNumber: null,
    stripePublishableKey: null,
    stripeSecretKey: null,
    stripeWebhookSecret: null,
    stripeWebhookSecretApp: null,
    collaborationEnabled: false,
    aiEnabled: false,
    aiProvider: 'gemini',
    aiModel: 'nvidia/nemotron-3-super-120b-a12b:free',
  }
}

export default class Update {
  async handle(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.user!
    const dek: Buffer = (ctx as any).dek

    if (!user.currentTeamId) {
      return response.notFound({ message: 'No team found' })
    }

    const company = await Company.findBy('teamId', user.currentTeamId)

    if (!company) {
      return response.notFound({ message: 'No company found. Create one first.' })
    }

    const payload = await request.validateUsing(updateCompanyValidator)
    const settings = await InvoiceSetting.findBy('teamId', user.currentTeamId)
    const {
      paymentMethods,
      customPaymentMethod,
      ...companyPayload
    } = payload

    const data: Record<string, any> = { ...companyPayload }
    encryptModelFields(data, [...ENCRYPTED_FIELDS.company], dek)

    company.merge(data as Partial<typeof company>)
    await company.save()

    let nextSettings = settings
    if (paymentMethods !== undefined || customPaymentMethod !== undefined) {
      if (!nextSettings) {
        nextSettings = await InvoiceSetting.create(buildDefaultInvoiceSettings(user.currentTeamId))
      }

      if (paymentMethods !== undefined) {
        nextSettings.paymentMethods = paymentMethods
      }

      if (customPaymentMethod !== undefined) {
        nextSettings.customPaymentMethod = customPaymentMethod || null
      }

      await nextSettings.save()
    }

    decryptModelFields(company, [...ENCRYPTED_FIELDS.company], dek)

    return response.ok({
      message: 'Company updated successfully',
      company: Object.assign(company, {
        paymentMethods: nextSettings?.paymentMethods || ['bank_transfer'],
        customPaymentMethod: nextSettings?.customPaymentMethod || '',
      }),
    })
  }
}
