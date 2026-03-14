import type { HttpContext } from '@adonisjs/core/http'
import Quote from '#models/quote/quote'
import Company from '#models/team/company'
import InvoiceSetting from '#models/team/invoice_setting'
import { buildFacturXFromQuote, generateFacturXXml } from '#services/pdf/facturx_generator'
import { submitInvoice, validateXml, type PdpConfig } from '#services/einvoicing/pdp_service'

export default class EInvoicingSubmit {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const invoiceSettings = await InvoiceSetting.query().where('team_id', teamId).first()
    if (!invoiceSettings?.eInvoicingEnabled) {
      return response.forbidden({ message: 'La facturation electronique n\'est pas activee' })
    }

    const quote = await Quote.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .preload('client')
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!quote) {
      return response.notFound({ message: 'Document non trouve' })
    }

    const company = await Company.query().where('team_id', teamId).first()

    // Build Factur-X XML
    const quoteData = {
      quoteNumber: quote.quoteNumber,
      subject: quote.subject,
      issueDate: quote.issueDate,
      validityDate: quote.validityDate,
      billingType: quote.billingType,
      subtotal: quote.subtotal,
      taxAmount: quote.taxAmount,
      total: quote.total,
      notes: quote.notes,
      language: quote.language || 'fr',
    }

    const linesData = quote.lines.map((l) => ({
      description: l.description,
      saleType: l.saleType,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      vatRate: l.vatRate,
      total: l.total,
    }))

    const clientData = quote.client
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
          vatNumber: quote.client.vatNumber,
        }
      : null

    const companyData = company
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

    const facturxDoc = buildFacturXFromQuote(quoteData, linesData, clientData, companyData)
    const xml = generateFacturXXml(facturxDoc)

    // Validate XML
    const pdpConfig: PdpConfig = {
      provider: invoiceSettings.pdpProvider || 'chorus_pro',
      apiKey: invoiceSettings.pdpApiKey,
      sandbox: invoiceSettings.pdpSandbox,
    }

    const validation = await validateXml(pdpConfig, xml)
    if (!validation.valid) {
      return response.unprocessableEntity({
        message: 'Le document ne passe pas la validation',
        errors: validation.errors,
        warnings: validation.warnings,
      })
    }

    // Submit to PDP
    const result = await submitInvoice(pdpConfig, xml, {
      documentNumber: quote.quoteNumber,
      documentType: 'quote',
    })

    return response.ok({
      message: result.success ? 'Document soumis avec succes' : 'Erreur lors de la soumission',
      result,
      warnings: validation.warnings,
    })
  }
}
