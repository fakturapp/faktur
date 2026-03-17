import type { HttpContext } from '@adonisjs/core/http'
import Quote from '#models/quote/quote'
import Company from '#models/team/company'
import InvoiceSetting from '#models/team/invoice_setting'
import { buildFacturXFromQuote, generateFacturXXml } from '#services/pdf/facturx_generator'
import { generateQuotePdf } from '#services/pdf/document_pdf_service'

export default class Pdf {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    try {
      const { pdfBuffer, filename } = await generateQuotePdf(params.id, teamId)

      // If e-invoicing is enabled, generate Factur-X headers
      const invoiceSettings = await InvoiceSetting.query().where('team_id', teamId).first()
      if (invoiceSettings?.eInvoicingEnabled) {
        const quote = await Quote.query()
          .where('id', params.id)
          .where('team_id', teamId)
          .preload('client')
          .preload('lines', (q) => q.orderBy('position', 'asc'))
          .first()

        if (quote) {
          const company = await Company.query().where('team_id', teamId).first()
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
          const clientData = quote.client ? {
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
          } : null
          const companyData = company ? {
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
          } : null

          const facturxDoc = buildFacturXFromQuote(quoteData, linesData, clientData, companyData)
          const facturxXml = generateFacturXXml(facturxDoc)
          response.header('X-Facturx-Profile', 'basic')
          response.header('X-Facturx-Xml-Size', Buffer.byteLength(facturxXml, 'utf-8').toString())
        }
      }

      response.header('Content-Type', 'application/pdf')
      response.header('Content-Disposition', `attachment; filename="${filename}"`)
      response.header('Content-Length', pdfBuffer.length.toString())
      return response.send(pdfBuffer)
    } catch {
      return response.notFound({ message: 'Quote not found' })
    }
  }
}

/**
 * Download Factur-X XML separately for a quote
 */
export class FacturXml {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const invoiceSettings = await InvoiceSetting.query().where('team_id', teamId).first()
    if (!invoiceSettings?.eInvoicingEnabled) {
      return response.forbidden({ message: 'E-invoicing not enabled' })
    }

    const quote = await Quote.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .preload('client')
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!quote) {
      return response.notFound({ message: 'Quote not found' })
    }

    const company = await Company.query().where('team_id', teamId).first()

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

    const filename = `facturx_${quote.quoteNumber.replace(/[^a-zA-Z0-9-_]/g, '_')}.xml`

    response.header('Content-Type', 'application/xml')
    response.header('Content-Disposition', `attachment; filename="${filename}"`)
    return response.send(xml)
  }
}
