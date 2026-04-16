import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Quote from '#models/quote/quote'
import Company from '#models/team/company'
import InvoiceSetting from '#models/team/invoice_setting'
import EinvoicingSubmission from '#models/einvoicing/einvoicing_submission'
import { buildFacturXFromQuote, generateFacturXXml } from '#services/pdf/facturx_generator'
import { submitInvoice, buildPdpConfig } from '#services/einvoicing/pdp_service'
import { validateCiiXml } from '#services/einvoicing/cii_xml_validator'
import {
  decryptModelFields,
  decryptModelFieldsArray,
  ENCRYPTED_FIELDS,
} from '#services/crypto/field_encryption_helper'
import { ApiError } from '#exceptions/api_error'

export default class EInvoicingSubmit {
  async handle(ctx: HttpContext) {
    const { auth, params, response } = ctx
    const dek: Buffer = (ctx as any).dek
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      throw new ApiError('team_not_selected')
    }

    const invoiceSettings = await InvoiceSetting.query().where('team_id', teamId).first()
    if (!invoiceSettings?.eInvoicingEnabled) {
      throw new ApiError('einvoicing_not_configured')
    }

    const quote = await Quote.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .preload('client')
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!quote) {
      throw new ApiError('quote_not_found')
    }

    const existingSubmission = await EinvoicingSubmission.query()
      .where('document_type', 'quote')
      .where('document_id', quote.id)
      .whereIn('status', ['submitted', 'accepted', 'delivered'])
      .first()

    if (existingSubmission) {
      throw new ApiError('einvoicing_submission_conflict', {
        details: {
          submissionId: existingSubmission.id,
          status: existingSubmission.status,
          trackingId: existingSubmission.trackingId,
        },
      })
    }

    decryptModelFields(quote, [...ENCRYPTED_FIELDS.quote], dek)
    decryptModelFieldsArray(quote.lines, [...ENCRYPTED_FIELDS.quoteLine], dek)
    if (quote.client) {
      decryptModelFields(quote.client, [...ENCRYPTED_FIELDS.client], dek)
    }

    const company = await Company.query().where('team_id', teamId).first()
    if (company) {
      decryptModelFields(company, [...ENCRYPTED_FIELDS.company], dek)
    }

    const clientData = (quote as any).clientSnapshot
      ? JSON.parse((quote as any).clientSnapshot)
      : quote.client
        ? {
            displayName: quote.client.displayName,
            companyName: quote.client.companyName,
            firstName: quote.client.firstName,
            lastName: quote.client.lastName,
            email: quote.client.email,
            address: quote.client.address,
            postalCode: quote.client.postalCode,
            city: quote.client.city,
            country: quote.client.country,
            siren: quote.client.siren,
            siret: (quote.client as any).siret,
            vatNumber: quote.client.vatNumber,
          }
        : null

    const companyData = (quote as any).companySnapshot
      ? JSON.parse((quote as any).companySnapshot)
      : company
        ? {
            legalName: company.legalName,
            siren: company.siren,
            siret: company.siret,
            vatNumber: company.vatNumber,
            addressLine1: company.addressLine1,
            postalCode: company.postalCode,
            city: company.city,
            country: company.country,
            email: company.email,
            phone: company.phone,
          }
        : null

    const linesData = quote.lines.map((l) => ({
      description: l.description,
      saleType: l.saleType,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      vatRate: l.vatRate,
      total: l.total,
    }))

    const quoteData = {
      quoteNumber: quote.quoteNumber,
      issueDate: quote.issueDate,
      validityDate: quote.validityDate,
      subtotal: quote.subtotal,
      taxAmount: quote.taxAmount,
      total: quote.total,
      notes: quote.notes,
      language: quote.language || 'fr',
    }

    const facturxDoc = buildFacturXFromQuote(quoteData, linesData, clientData, companyData)
    const xml = generateFacturXXml(facturxDoc)

    const validation = validateCiiXml(xml)
    if (!validation.valid) {
      return response.unprocessableEntity({
        message: 'Le document ne passe pas la validation CII EN 16931',
        errors: validation.errors,
        warnings: validation.warnings,
        profile: validation.profile,
      })
    }

    const submission = await EinvoicingSubmission.create({
      teamId,
      documentType: 'quote',
      documentId: quote.id,
      documentNumber: quote.quoteNumber,
      provider: invoiceSettings.pdpProvider || 'sandbox',
      status: 'pending',
      statusMessage: 'Soumission en cours',
      lifecycleEvents: [{ status: 'pending', message: 'Soumission initiee', timestamp: new Date().toISOString() }],
      xmlContent: xml,
      submittedByUserId: user.id,
    })

    decryptModelFields(invoiceSettings, [...ENCRYPTED_FIELDS.invoiceSetting], dek)
    const pdpConfig = buildPdpConfig(invoiceSettings)

    const result = await submitInvoice(pdpConfig, xml, {
      documentNumber: quote.quoteNumber,
      documentType: 'quote',
    })

    submission.trackingId = result.trackingId
    submission.externalId = result.externalId || null
    submission.status = result.success ? 'submitted' : 'error'
    submission.statusMessage = result.message
    submission.submittedAt = DateTime.now()
    submission.addLifecycleEvent(
      result.success ? 'submitted' : 'error',
      result.message
    )
    await submission.save()

    return response.ok({
      message: result.success ? 'Document soumis avec succes' : 'Erreur lors de la soumission',
      submission: {
        id: submission.id,
        status: submission.status,
        trackingId: submission.trackingId,
        provider: submission.provider,
      },
      validation: {
        warnings: validation.warnings,
        profile: validation.profile,
      },
    })
  }
}
