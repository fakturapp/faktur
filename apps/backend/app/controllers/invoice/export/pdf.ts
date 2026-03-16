import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { existsSync, readFileSync } from 'node:fs'
import { join, extname } from 'node:path'
import Invoice from '#models/invoice/invoice'
import Company from '#models/team/company'
import InvoiceSetting from '#models/team/invoice_setting'
import BankAccount from '#models/team/bank_account'
import EncryptionService from '#services/encryption/encryption_service'
import { renderQuoteHtml } from '#services/pdf/html_renderer'
import { generatePdf } from '#services/pdf/pdf_generator'

function resolveLogoToBase64(logoUrl: string | null): string | null {
  if (!logoUrl) return null
  if (logoUrl.startsWith('data:') || logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
    return logoUrl
  }
  const match = logoUrl.match(/^\/invoice-logos\/(.+)$/)
  if (!match) return null
  const filePath = join(app.tmpPath(), 'uploads', 'invoice-logos', match[1])
  if (!existsSync(filePath)) return null
  const ext = extname(filePath).toLowerCase().replace('.', '')
  const mimeMap: Record<string, string> = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', webp: 'image/webp',
  }
  const mime = mimeMap[ext] || 'image/png'
  const base64 = readFileSync(filePath).toString('base64')
  return `data:${mime};base64,${base64}`
}

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

    const invoice = await Invoice.query()
      .where('id', params.id)
      .where('team_id', teamId)
      .preload('client')
      .preload('lines', (q) => q.orderBy('position', 'asc'))
      .first()

    if (!invoice) {
      return response.notFound({ message: 'Invoice not found' })
    }

    const company = await Company.query().where('team_id', teamId).first()
    const invoiceSettings = await InvoiceSetting.query().where('team_id', teamId).first()

    const settingsData = {
      template: invoiceSettings?.template || 'classique',
      darkMode: invoiceSettings?.darkMode || false,
      paymentMethods: invoiceSettings?.paymentMethods || ['bank_transfer'],
      customPaymentMethod: invoiceSettings?.customPaymentMethod || null,
      documentFont: invoiceSettings?.documentFont || 'Lexend',
      documentType: 'invoice' as const,
      footerMode: (invoiceSettings?.footerMode as 'company_info' | 'vat_exempt' | 'custom') || 'vat_exempt',
    }

    const logoSource = invoiceSettings?.logoSource || 'custom'
    const settingsLogoUrl = logoSource === 'company' ? (company?.logoUrl || null) : (invoiceSettings?.logoUrl || null)
    const rawLogoUrl = invoice.logoUrl || settingsLogoUrl
    const resolvedLogoUrl = resolveLogoToBase64(rawLogoUrl)

    const quoteData = {
      quoteNumber: invoice.invoiceNumber,
      status: invoice.status,
      subject: invoice.subject,
      issueDate: invoice.issueDate,
      validityDate: invoice.dueDate,
      billingType: invoice.billingType,
      accentColor: invoice.accentColor,
      logoUrl: resolvedLogoUrl,
      notes: invoice.notes,
      acceptanceConditions: invoice.acceptanceConditions,
      signatureField: invoice.signatureField,
      documentTitle: invoice.documentTitle || 'Facture',
      freeField: invoice.freeField,
      globalDiscountType: invoice.globalDiscountType,
      globalDiscountValue: invoice.globalDiscountValue,
      deliveryAddress: invoice.deliveryAddress,
      clientSiren: invoice.clientSiren,
      clientVatNumber: invoice.clientVatNumber,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      language: invoice.language || 'fr',
      vatExempt: invoiceSettings?.defaultVatExempt || false,
      footerText: invoiceSettings?.defaultFooterText || null,
      logoBorderRadius: invoiceSettings?.logoBorderRadius ?? 0,
    }

    const linesData = invoice.lines.map((l) => ({
      description: l.description,
      saleType: l.saleType,
      quantity: l.quantity,
      unit: l.unit,
      unitPrice: l.unitPrice,
      vatRate: l.vatRate,
      total: l.total,
    }))

    const clientData = invoice.client
      ? {
          type: invoice.client.type,
          displayName: invoice.client.displayName,
          companyName: invoice.client.companyName,
          firstName: invoice.client.firstName,
          lastName: invoice.client.lastName,
          email: invoice.client.email,
          phone: invoice.client.phone,
          address: invoice.client.address,
          addressComplement: invoice.client.addressComplement,
          postalCode: invoice.client.postalCode,
          city: invoice.client.city,
          country: invoice.client.country,
          siren: invoice.client.siren,
          vatNumber: invoice.client.vatNumber,
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

    // Override bank info from linked bank account
    if (invoice.bankAccountId && companyData) {
      const bankAccount = await BankAccount.find(invoice.bankAccountId)
      if (bankAccount) {
        let iban = bankAccount.iban
        let bic = bankAccount.bic
        if (bankAccount.isEncrypted) {
          if (iban) {
            try { iban = EncryptionService.decrypt(iban) } catch { iban = null }
          }
          if (bic) {
            try { bic = EncryptionService.decrypt(bic) } catch { bic = null }
          }
        }
        companyData.iban = iban
        companyData.bic = bic
        companyData.bankName = bankAccount.bankName
      }
    }

    const html = renderQuoteHtml(quoteData, linesData, clientData, companyData, settingsData)
    const pdfBuffer = await generatePdf(html)

    const filenamePattern = invoiceSettings?.invoiceFilenamePattern || 'FAC-{numero}'
    const resolvedName = resolveFilenamePattern(filenamePattern, {
      numero: invoice.invoiceNumber,
      date: invoice.issueDate ? new Date(invoice.issueDate.toString()).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      client: invoice.client?.displayName || invoice.client?.companyName || 'client',
      entreprise: company?.legalName || company?.tradeName || 'entreprise',
    })
    const filename = `${resolvedName}.pdf`

    response.header('Content-Type', 'application/pdf')
    response.header('Content-Disposition', `attachment; filename="${filename}"`)
    response.header('Content-Length', pdfBuffer.length.toString())
    return response.send(pdfBuffer)
  }
}
