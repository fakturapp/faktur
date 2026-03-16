import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { existsSync, readFileSync } from 'node:fs'
import { join, extname } from 'node:path'
import Quote from '#models/quote/quote'
import Company from '#models/team/company'
import InvoiceSetting from '#models/team/invoice_setting'
import { renderQuoteHtml } from '#services/pdf/html_renderer'
import { generatePdf } from '#services/pdf/pdf_generator'
import { buildFacturXFromQuote, generateFacturXXml } from '#services/pdf/facturx_generator'

/**
 * Convert a relative logo URL (e.g. /invoice-logos/xxx.png) to a base64 data URL
 * so that Puppeteer can render it without needing a live HTTP server.
 */
function resolveLogoToBase64(logoUrl: string | null): string | null {
  if (!logoUrl) return null

  // Already a data URL or absolute URL
  if (logoUrl.startsWith('data:') || logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
    return logoUrl
  }

  // Extract filename from /invoice-logos/{filename}
  const match = logoUrl.match(/^\/invoice-logos\/(.+)$/)
  if (!match) return null

  const filePath = join(app.tmpPath(), 'uploads', 'invoice-logos', match[1])
  if (!existsSync(filePath)) return null

  const ext = extname(filePath).toLowerCase().replace('.', '')
  const mimeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    svg: 'image/svg+xml',
    webp: 'image/webp',
  }
  const mime = mimeMap[ext] || 'image/png'
  const base64 = readFileSync(filePath).toString('base64')
  return `data:${mime};base64,${base64}`
}

/**
 * Resolve a filename pattern like "DEV-{numero}" into an actual filename.
 * Supported variables: {numero}, {date}, {client}, {entreprise}
 */
function resolveFilenamePattern(
  pattern: string,
  vars: { numero: string; date: string; client: string; entreprise: string }
): string {
  return pattern
    .replace(/\{numero\}/gi, vars.numero)
    .replace(/\{date\}/gi, vars.date)
    .replace(/\{client\}/gi, vars.client)
    .replace(/\{entreprise\}/gi, vars.entreprise)
    .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ\-_.\s]/g, '')
    .replace(/\s+/g, '_')
}

export default class Pdf {
  async handle({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
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

    const invoiceSettings = await InvoiceSetting.query().where('team_id', teamId).first()

    const settingsData = {
      template: invoiceSettings?.template || 'classique',
      darkMode: invoiceSettings?.darkMode || false,
      paymentMethods: invoiceSettings?.paymentMethods || ['bank_transfer'],
      customPaymentMethod: invoiceSettings?.customPaymentMethod || null,
      documentFont: invoiceSettings?.documentFont || 'Lexend',
      documentType: 'quote' as const,
      footerMode: (invoiceSettings?.footerMode as 'company_info' | 'vat_exempt' | 'custom') || 'vat_exempt',
    }

    // Resolve logo based on source preference: custom (invoice settings) or company
    const logoSource = invoiceSettings?.logoSource || 'custom'
    const settingsLogoUrl = logoSource === 'company' ? (company?.logoUrl || null) : (invoiceSettings?.logoUrl || null)
    const rawLogoUrl = quote.logoUrl || settingsLogoUrl
    const resolvedLogoUrl = resolveLogoToBase64(rawLogoUrl)

    const quoteData = {
      quoteNumber: quote.quoteNumber,
      status: quote.status,
      subject: quote.subject,
      issueDate: quote.issueDate,
      validityDate: quote.validityDate,
      billingType: quote.billingType,
      accentColor: quote.accentColor,
      logoUrl: resolvedLogoUrl,
      notes: quote.notes,
      acceptanceConditions: quote.acceptanceConditions,
      signatureField: quote.signatureField,
      documentTitle: quote.documentTitle,
      freeField: quote.freeField,
      globalDiscountType: quote.globalDiscountType,
      globalDiscountValue: quote.globalDiscountValue,
      deliveryAddress: quote.deliveryAddress,
      clientSiren: quote.clientSiren,
      clientVatNumber: quote.clientVatNumber,
      subtotal: quote.subtotal,
      taxAmount: quote.taxAmount,
      total: quote.total,
      language: quote.language || 'fr',
      vatExempt: invoiceSettings?.defaultVatExempt || false,
      footerText: invoiceSettings?.defaultFooterText || null,
      logoBorderRadius: invoiceSettings?.logoBorderRadius ?? 0,
    }

    const linesData = quote.lines.map((l) => ({
      description: l.description,
      saleType: l.saleType,
      quantity: l.quantity,
      unit: l.unit,
      unitPrice: l.unitPrice,
      vatRate: l.vatRate,
      total: l.total,
    }))

    const clientData = quote.client
      ? {
          type: quote.client.type,
          displayName: quote.client.displayName,
          companyName: quote.client.companyName,
          firstName: quote.client.firstName,
          lastName: quote.client.lastName,
          email: quote.client.email,
          phone: quote.client.phone,
          address: quote.client.address,
          addressComplement: quote.client.addressComplement,
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
          tradeName: company.tradeName,
          siren: company.siren,
          siret: company.siret,
          vatNumber: company.vatNumber,
          legalForm: company.legalForm,
          addressLine1: company.addressLine1,
          addressLine2: company.addressLine2,
          city: company.city,
          postalCode: company.postalCode,
          country: company.country,
          phone: company.phone,
          email: company.email,
          website: company.website,
          iban: company.iban,
          bic: company.bic,
          bankName: company.bankName,
        }
      : null

    const html = renderQuoteHtml(quoteData, linesData, clientData, companyData, settingsData)
    const pdfBuffer = await generatePdf(html)

    const filenamePattern = invoiceSettings?.quoteFilenamePattern || 'DEV-{numero}'
    const resolvedName = resolveFilenamePattern(filenamePattern, {
      numero: quote.quoteNumber,
      date: quote.issueDate ? new Date(quote.issueDate.toString()).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      client: quote.client?.displayName || quote.client?.companyName || 'client',
      entreprise: company?.legalName || company?.tradeName || 'entreprise',
    })
    const filename = `${resolvedName}.pdf`

    // If e-invoicing is enabled, generate Factur-X XML and include metadata
    if (invoiceSettings?.eInvoicingEnabled) {
      const facturxDoc = buildFacturXFromQuote(quoteData, linesData, clientData, companyData)
      const facturxXml = generateFacturXXml(facturxDoc)
      response.header('X-Facturx-Profile', 'basic')
      response.header('X-Facturx-Xml-Size', Buffer.byteLength(facturxXml, 'utf-8').toString())
    }

    response.header('Content-Type', 'application/pdf')
    response.header('Content-Disposition', `attachment; filename="${filename}"`)
    response.header('Content-Length', pdfBuffer.length.toString())
    return response.send(pdfBuffer)
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
